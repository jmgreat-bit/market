import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Supabase admin client (server-side only) ────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── System prompt for AI context ────────────────────────
const SYSTEM_PROMPT = `You are MarketPLC AI, a helpful assistant for finding local businesses, products, and services in Rwanda. 
You answer based ONLY on real data from the MarketPLC platform. 
If you don't have relevant data, say so honestly.
Keep responses concise and helpful.`;

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
                { error: 'Missing required fields: message and userId' },
                { status: 400 }
            );
        }

        // ── 1. Fetch recent posts (last 7 days) ────────
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentPosts } = await supabase
            .from('posts')
            .select(`
                id, content, image_url, latitude, longitude, created_at,
                business:business_details(id, business_name, category, bio, address, latitude, longitude)
            `)
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(100);

        // ── 2. Fetch businesses ─────────────────────────
        const { data: businesses } = await supabase
            .from('business_details')
            .select('id, business_name, category, bio, address, phone, latitude, longitude')
            .limit(200);

        // ── 3. Filter by proximity if location available ─
        let nearbyPosts = recentPosts || [];
        let nearbyBusinesses = businesses || [];

        if (latitude && longitude) {
            const RADIUS_KM = 10;

            nearbyPosts = nearbyPosts.filter((post) => {
                const pLat = post.latitude || (post.business as any)?.latitude;
                const pLng = post.longitude || (post.business as any)?.longitude;
                if (!pLat || !pLng) return true; // include posts without location
                return haversineKm(latitude, longitude, pLat, pLng) <= RADIUS_KM;
            });

            nearbyBusinesses = nearbyBusinesses.filter((biz) => {
                if (!biz.latitude || !biz.longitude) return true;
                return haversineKm(latitude, longitude, biz.latitude, biz.longitude) <= RADIUS_KM;
            });
        }

        // ──────────────────────────────────────────────────
        // TODO: Gemini API integration
        // When a Gemini API key is configured, replace the fallback
        // search below with a call like:
        //
        // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        // const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        //
        // const contextData = JSON.stringify({
        //     posts: nearbyPosts.slice(0, 20),
        //     businesses: nearbyBusinesses.slice(0, 20),
        // });
        //
        // const result = await model.generateContent([
        //     SYSTEM_PROMPT,
        //     `Context data:\n${contextData}`,
        //     `User question: ${message}`,
        // ]);
        //
        // const response = result.response.text();
        // ──────────────────────────────────────────────────

        // ── 4. Smart fallback: keyword-based search ─────
        const response = generateFallbackResponse(message, nearbyPosts, nearbyBusinesses);

        return NextResponse.json({ response });
    } catch (err) {
        console.error('[AI Chat API] Error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ── Fallback response generator ─────────────────────────
function generateFallbackResponse(
    query: string,
    posts: any[],
    businesses: any[]
): string {
    const q = query.toLowerCase();

    // Extract keywords from the query
    const keywords = q
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    // Score and rank businesses by keyword relevance
    const scoredBusinesses = businesses
        .map((biz) => {
            const searchText = [
                biz.business_name,
                biz.category,
                biz.bio,
                biz.address,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            let score = 0;
            for (const keyword of keywords) {
                if (searchText.includes(keyword)) score += 1;
            }
            // Bonus for category match
            if (biz.category && keywords.some((k) => biz.category.toLowerCase().includes(k))) {
                score += 2;
            }
            return { ...biz, score };
        })
        .filter((biz) => biz.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    // Score and rank posts by keyword relevance
    const scoredPosts = posts
        .map((post) => {
            const searchText = [
                post.content,
                (post.business as any)?.business_name,
                (post.business as any)?.category,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            let score = 0;
            for (const keyword of keywords) {
                if (searchText.includes(keyword)) score += 1;
            }
            return { ...post, score };
        })
        .filter((post) => post.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    // ── Build response ──────────────────────────────────
    if (scoredBusinesses.length === 0 && scoredPosts.length === 0) {
        return "I couldn't find anything matching your query right now. Try searching for restaurants, shops, or services near you.";
    }

    const parts: string[] = [];

    if (scoredBusinesses.length > 0) {
        parts.push(`I found ${scoredBusinesses.length} business${scoredBusinesses.length > 1 ? 'es' : ''} that might interest you:\n`);

        scoredBusinesses.forEach((biz, i) => {
            const details: string[] = [];
            if (biz.category) details.push(biz.category);
            if (biz.address) details.push(`📍 ${biz.address}`);
            if (biz.phone) details.push(`📞 ${biz.phone}`);

            parts.push(`${i + 1}. **${biz.business_name}**`);
            if (details.length > 0) parts.push(`   ${details.join(' · ')}`);
            if (biz.bio) parts.push(`   ${biz.bio.slice(0, 100)}${biz.bio.length > 100 ? '...' : ''}`);
            parts.push('');
        });
    }

    if (scoredPosts.length > 0) {
        if (scoredBusinesses.length > 0) parts.push('---\n');
        parts.push(`📢 Recent posts you might like:\n`);

        scoredPosts.forEach((post) => {
            const bizName = (post.business as any)?.business_name;
            const preview = post.content.slice(0, 120) + (post.content.length > 120 ? '...' : '');
            parts.push(`• ${bizName ? `**${bizName}**: ` : ''}${preview}`);
        });
    }

    return parts.join('\n');
}

// ── Stop words to ignore in keyword extraction ──────────
const STOP_WORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
    'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has',
    'have', 'been', 'some', 'them', 'than', 'its', 'over',
    'any', 'that', 'this', 'from', 'with', 'what', 'where',
    'when', 'how', 'who', 'which', 'there', 'near', 'find',
    'show', 'tell', 'give', 'know', 'looking', 'want', 'need',
    'like', 'best', 'good', 'open', 'today', 'nearby',
]);
