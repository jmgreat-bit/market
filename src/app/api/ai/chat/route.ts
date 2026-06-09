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
        const { message, userId, latitude, longitude } = body as {
            message: string;
            userId: string;
            latitude?: number;
            longitude?: number;
        };

        if (!message || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json" } });

        // ── 1. Phase 1: Intent & Keyword Extraction ─────────
        const extractPrompt = `
You are a search parameter extractor for a local marketplace.
User request: "${message}"
Extract the main keywords to search for in our database (e.g. products, categories, business names).
Return a JSON object: {"keywords": ["word1", "word2"]}
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
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);

        let query = supabase
            .from('posts')
            .select(`
                id, content, image_url, latitude, longitude, created_at,
                business:business_details(id, business_name, category, bio, address, phone, latitude, longitude)
            `)
            .gte('created_at', sevenDaysAgo.toISOString())
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
        if (candidatePosts.length === 0) {
            return NextResponse.json({ 
                response: JSON.stringify({
                    text: "I couldn't find any recent posts matching your request nearby. Try expanding your search or looking for something else!",
                    posts: []
                }) 
            });
        }

        const synthesisModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json" } });
        
        const synthesisPrompt = `
You are MarketPLC AI, a helpful local assistant in Rwanda.
User question: "${message}"

Here are the candidate posts from our database:
${JSON.stringify(candidatePosts.map(p => ({
    id: p.id,
    business: (p.business as any)?.business_name,
    content: p.content,
    distance_km: (latitude && longitude && ((p.latitude || (p.business as any)?.latitude) != null)) ? haversineKm(latitude, longitude, (p.latitude || (p.business as any)?.latitude), (p.longitude || (p.business as any)?.longitude)).toFixed(1) : 'unknown'
})))}

Task:
1. Review the posts and select up to 5 that best match the user's request (consider price if mentioned in the post content).
2. Write a friendly, conversational text answer recommending them.
3. Return exactly this JSON format:
{
  "text": "Your friendly conversational response...",
  "post_ids": ["id-1", "id-2"]
}
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

        // ── 4. Deduct Credits Securely ──────────────────────
        const { data: creditRows } = await supabase
            .from('ai_credits')
            .select('id, total_credits, used_credits')
            .eq('user_id', userId)
            .lt('used_credits', 999999) // hack to find ones where used < total
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

        return NextResponse.json({ response: responseString });
    } catch (err) {
        console.error('[AI Chat API] Error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
