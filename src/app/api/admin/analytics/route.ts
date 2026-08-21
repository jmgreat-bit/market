import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Extremely basic admin check for the API route
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, email')
            .eq('id', user.id)
            .single();

        const isMaster = profile?.email === 'thegreat@admin.sir';
        const isStaff = profile?.email?.endsWith('@staff.marketplc.com');

        if (!isMaster && !isStaff) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse query params
        const url = new URL(req.url);
        const range = url.searchParams.get('range') || '7d';

        const now = new Date();
        let startDate = new Date(0); // Epoch for 'all'

        if (range === 'today') {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
        } else if (range === '7d') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
        } else if (range === '30d') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
        }

        const startIso = startDate.toISOString();

        // Fetch Data
        const [
            { data: profiles },
            { data: searchLogs },
            { data: profileViews },
            { data: subscriptions }
        ] = await Promise.all([
            supabase.from('profiles').select('created_at').gte('created_at', startIso),
            supabase.from('search_logs').select('query, created_at').gte('created_at', startIso),
            supabase.from('profile_views').select('created_at').gte('created_at', startIso),
            isMaster ? supabase.from('trader_subscriptions').select('amount_rwf, created_at, payment_status').gte('created_at', startIso).eq('payment_status', 'completed') : Promise.resolve({ data: [] })
        ]);

        // Process Signups Over Time (Group by YYYY-MM-DD)
        const signupsMap = new Map<string, number>();
        if (profiles) {
            for (let i = 0; i < profiles.length; i++) {
                const d = profiles[i].created_at.substring(0, 10);
                const count = signupsMap.get(d);
                signupsMap.set(d, count ? count + 1 : 1);
            }
        }
        const usersOverTime = Array.from(signupsMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, signups]) => ({ date, signups }));

        // Process Revenue Over Time (Group by YYYY-MM-DD)
        const revenueMap = new Map<string, number>();
        if (isMaster && subscriptions) {
            for (let i = 0; i < subscriptions.length; i++) {
                const d = subscriptions[i].created_at.substring(0, 10);
                const amount = subscriptions[i].amount_rwf || 0;
                const current = revenueMap.get(d);
                revenueMap.set(d, current ? current + amount : amount);
            }
        }
        const revenueOverTime = Array.from(revenueMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, revenue]) => ({ date, revenue }));

        // Process Peak Usage (Group by hour 00-23)
        const hourMap = new Array<{ hour: string; searches: number; views: number }>(24);
        for (let i = 0; i < 24; i++) {
            hourMap[i] = { hour: `${i.toString().padStart(2, '0')}:00`, searches: 0, views: 0 };
        }
        if (searchLogs) {
            for (let i = 0; i < searchLogs.length; i++) {
                const h = parseInt(searchLogs[i].created_at.substring(11, 13), 10);
                if (h >= 0 && h < 24) hourMap[h].searches++;
            }
        }
        if (profileViews) {
            for (let i = 0; i < profileViews.length; i++) {
                const h = parseInt(profileViews[i].created_at.substring(11, 13), 10);
                if (h >= 0 && h < 24) hourMap[h].views++;
            }
        }
        const peakUsage = hourMap;

        // Process Top Searches
        const searchCounts: Record<string, number> = {};
        searchLogs?.forEach(s => {
            const q = s.query?.toLowerCase().trim();
            if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
        });
        const topSearches = Object.entries(searchCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([query, count]) => ({ query, count }));

        // Current totals for the overview
        const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: totalBusinesses } = await supabase.from('business_details').select('*', { count: 'exact', head: true });
        const { count: totalAds } = await supabase.from('ads').select('*', { count: 'exact', head: true });
        
        let mrr = 0;
        let proCount = 0;
        let nationalCount = 0;
        let totalAiCreditsSold = 0;
        
        if (isMaster) {
            const { count: activePro } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('trader_tier', 'pro');
            const { count: activeNational } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('trader_tier', 'national');
            const { count: aiCreditsCount } = await supabase.from('ai_credits').select('*', { count: 'exact', head: true });
            
            proCount = activePro || 0;
            nationalCount = activeNational || 0;
            totalAiCreditsSold = aiCreditsCount || 0;
            mrr = (proCount * 3000) + (nationalCount * 35000);
        }

        return NextResponse.json({
            usersOverTime,
            revenueOverTime,
            peakUsage,
            topSearches,
            overview: {
                totalUsers,
                totalBusinesses,
                totalAds,
                mrr,
                proCount,
                nationalCount,
                totalAiCreditsSold
            }
        });

    } catch (err) {
        console.error('[admin/analytics] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
