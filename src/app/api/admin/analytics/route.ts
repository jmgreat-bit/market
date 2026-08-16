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
        const signupsMap: Record<string, number> = {};
        profiles?.forEach(p => {
            const d = p.created_at.split('T')[0];
            signupsMap[d] = (signupsMap[d] || 0) + 1;
        });
        const usersOverTime = Object.keys(signupsMap).sort().map(date => ({
            date,
            signups: signupsMap[date]
        }));

        // Process Revenue Over Time (Group by YYYY-MM-DD)
        const revenueMap: Record<string, number> = {};
        if (isMaster && subscriptions) {
            subscriptions.forEach(s => {
                const d = s.created_at.split('T')[0];
                revenueMap[d] = (revenueMap[d] || 0) + (s.amount_rwf || 0);
            });
        }
        const revenueOverTime = Object.keys(revenueMap).sort().map(date => ({
            date,
            revenue: revenueMap[date]
        }));

        // Process Peak Usage (Group by hour 00-23)
        const hourMap: Record<string, { searches: number, views: number }> = {};
        for (let i = 0; i < 24; i++) {
            hourMap[i.toString().padStart(2, '0')] = { searches: 0, views: 0 };
        }
        searchLogs?.forEach(s => {
            const h = new Date(s.created_at).getHours().toString().padStart(2, '0');
            if (hourMap[h]) hourMap[h].searches++;
        });
        profileViews?.forEach(v => {
            const h = new Date(v.created_at).getHours().toString().padStart(2, '0');
            if (hourMap[h]) hourMap[h].views++;
        });
        const peakUsage = Object.keys(hourMap).sort().map(hour => ({
            hour: `${hour}:00`,
            searches: hourMap[hour].searches,
            views: hourMap[hour].views
        }));

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
        if (isMaster) {
            const { count: activePro } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('trader_tier', 'pro');
            const { count: activeNational } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('trader_tier', 'national');
            mrr = ((activePro || 0) * 3000) + ((activeNational || 0) * 35000);
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
                mrr
            }
        });

    } catch (err) {
        console.error('[admin/analytics] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
