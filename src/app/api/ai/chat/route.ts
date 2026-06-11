import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Supabase admin client (server-side only) ────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Helper: calculate distance (km) between two points ──
function haversineKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── POST handler ────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, userId, latitude, longitude, sessionId } = body as {
            message: string;
            userId: string;
            latitude?: number;
            longitude?: number;
            sessionId: string;
        };

        if (!message || !userId || !sessionId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // ── 0. Pre-flight Credit Check ──────────────────────────
        const { data: creditCheck } = await supabase
            .from('ai_credits')
            .select('id, total_credits, used_credits')
            .eq('user_id', userId)
            .order('purchased_at', { ascending: true });
        
        let hasCredits = false;
        if (creditCheck) {
            for (const row of creditCheck) {
                if (row.used_credits < row.total_credits) {
                    hasCredits = true;
                    break;
                }
            }
        }
        
        if (!hasCredits) {
             return NextResponse.json({ error: 'Out of AI credits. Please purchase an AI Discovery package in the Premium menu.' }, { status: 403 });
        }

        // ── 0.5 Save User Message to History ────────────────────
        await supabase.from('ai_conversations').insert({
            user_id: userId,
            role: 'user',
            content: message
        });

        // ── 0.6 Fetch Past 5 Messages for Memory Context ────────
        const { data: pastMessages } = await supabase
            .from('ai_conversations')
            .select('role, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);
        
        let chatContext = '';
        if (pastMessages && pastMessages.length > 0) {
            // Reverse so they are chronological
            const chronological = pastMessages.reverse();
            chatContext = chronological.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });

        // ── 1. Phase 1: Intent, Keyword Extraction & Multilingual Expansion ─────────
        const extractPrompt = `
You are a search query expander for a local marketplace in Rwanda.
User request: "${message}"

Task:
1. Identify the core intent of the user's request (what are they looking to buy, rent, or find?).
2. Generate a list of search keywords for our database. 
3. CRITICAL: You MUST expand these keywords into multiple languages (English, Kinyarwanda, French) and include common synonyms. 
   For example, if they ask for "office", include ["office", "ibiro", "workspace", "meeting room", "gukodesha", "rent"].
4. Return ONLY a JSON object exactly like this: {"keywords": ["word1", "word2", "word3"]}
`;
        const extractResult = await model.generateContent(extractPrompt);
        let extractedParams = { keywords: [] as string[] };
        try {
            extractedParams = JSON.parse(extractResult.response.text());
        } catch (e) {
            console.error("Failed to parse Gemini keywords", e);
            // fallback generic keywords
            extractedParams.keywords = message.split(' ').filter(w => w.length > 3);
        }

        // ── 2. Phase 2: Database Pre-filtering ──────────────
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let query = supabase
            .from('posts')
            .select(`
                id, content, image_url, latitude, longitude, created_at,
                business:business_details(id, business_name, category, bio, address, phone, latitude, longitude)
            `)
            .gte('created_at', ninetyDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(200);

        const { data: rawPosts } = await query;
        let candidatePosts = rawPosts || [];

        // Apply Proximity Filter
        if (latitude && longitude) {
            const RADIUS_KM = 30; // Search within 30km
            candidatePosts = candidatePosts.filter((post) => {
                const pLat = post.latitude || (post.business as any)?.latitude;
                const pLng = post.longitude || (post.business as any)?.longitude;
                if (!pLat || !pLng) return true; 
                return haversineKm(latitude, longitude, pLat, pLng) <= RADIUS_KM;
            });
        }

        // Apply Keyword Filter (in memory to avoid complex SQL ilike chains)
        if (extractedParams.keywords && extractedParams.keywords.length > 0) {
            candidatePosts = candidatePosts.filter((post) => {
                const text = (post.content + ' ' + (post.business as any)?.business_name + ' ' + (post.business as any)?.category).toLowerCase();
                return extractedParams.keywords.some(k => text.includes(k.toLowerCase()));
            });
        }

        // Limit candidates to save tokens
        candidatePosts = candidatePosts.slice(0, 30);

        // ── 3. Phase 3: AI Synthesis ────────────────────────
        const synthesisModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
        
        const synthesisPrompt = `
You are MarketPLC AI, a friendly and helpful local assistant in Rwanda.
User request: "${message}"

Here are the candidate posts from our database based on the user's keywords:
${candidatePosts.length === 0 ? "[] (No matches found for specific keywords)" : JSON.stringify(candidatePosts.map(p => ({
    id: p.id,
    business: (p.business as any)?.business_name,
    content: p.content,
    distance_km: (latitude && longitude && ((p.latitude || (p.business as any)?.latitude) != null)) ? haversineKm(latitude, longitude, (p.latitude || (p.business as any)?.latitude), (p.longitude || (p.business as any)?.longitude)).toFixed(1) : 'unknown'
})))}

Task:
1. Review the "Previous Conversation Context" (if it exists) so you can remember what you and the user were talking about.
2. If the user is just saying hello, greeting you, or chatting ("hello", "bite byawe", etc.), reply naturally and warmly in the same language. Ask how you can help them find local businesses or products today.
3. If they are looking for something, review the candidate posts and select up to 5 that BEST match. 
   CRITICAL RELEVANCY RULE: Do NOT select posts that are out of context or unrelated. If only 1 post matches perfectly, only return 1. If none match perfectly, return 0 posts.
4. Write a conversational text answer. If there are no highly relevant candidate posts for a shopping query, politely say you couldn't find exact matches nearby.
5. Return exactly this JSON format:
{
  "text": "Your friendly conversational response...",
  "post_ids": ["id-1", "id-2"]
}

---
Previous Conversation Context:
${chatContext ? chatContext : 'No previous messages in this session yet.'}
---
`;

        const synthesisResult = await synthesisModel.generateContent(synthesisPrompt);
        let finalOutput = { text: "I found some options!", post_ids: [] as string[] };
        try {
            finalOutput = JSON.parse(synthesisResult.response.text());
        } catch (e) {
            console.error("Failed to parse final AI output", e);
        }

        // Map the selected IDs back to full post objects for the frontend
        const selectedPosts = candidatePosts.filter(p => finalOutput.post_ids.includes(p.id));

        // Note: Client expects `response` field containing a string if it's text, or JSON string
        // We'll return it as a JSON string so frontend can JSON.parse it.
        const responseString = JSON.stringify({
            text: finalOutput.text,
            posts: selectedPosts
        });

        // ── 4. Save AI Response to History ──────────────────
        await supabase.from('ai_conversations').insert({
            user_id: userId,
            role: 'assistant',
            content: finalOutput.text
        });

        // ── 5. Deduct Credits Securely ──────────────────────
        // Deduct 1 credit because we successfully answered the user's prompt
        const { data: creditRows } = await supabase
            .from('ai_credits')
            .select('id, total_credits, used_credits')
            .eq('user_id', userId)
            .lt('used_credits', 999999) 
            .order('purchased_at', { ascending: true })
            .limit(1);

        if (creditRows && creditRows.length > 0) {
            const row = creditRows[0];
            if (row.used_credits < row.total_credits) {
                await supabase
                    .from('ai_credits')
                    .update({ used_credits: row.used_credits + 1 })
                    .eq('id', row.id);
            }
        }

        return new NextResponse(JSON.stringify({ response: responseString }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error('[AI Chat API] Error:', err);
        return NextResponse.json(
            { error: 'The AI is currently experiencing high demand. Please try again in a moment.' },
            { status: 500 }
        );
    }
}
