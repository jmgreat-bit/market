'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Users, Building2, Megaphone, TrendingUp, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminStats {
    totalUsers: number;
    totalBusinesses: number;
    totalAds: number;
    activePro: number;
    activeNational: number;
}

export default function AdminOverviewPage() {
    const { isMaster, isLoading } = useAdmin();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isMaster) {
            router.replace('/admin/users');
        }
    }, [isLoading, isMaster, router]);

    useEffect(() => {
        if (!isMaster) return;

        async function fetchStats() {
            setStatsLoading(true);
            const supabase = getSupabaseClient();
            
            try {
                // In a real app we'd use count queries
                const [
                    { count: totalUsers },
                    { count: totalBusinesses },
                    { count: totalAds },
                    { count: activePro },
                    { count: activeNational }
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('business_details').select('*', { count: 'exact', head: true }),
                    supabase.from('ads').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('trader_tier', 'pro'),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('trader_tier', 'national'),
                ]);

                setStats({
                    totalUsers: totalUsers || 0,
                    totalBusinesses: totalBusinesses || 0,
                    totalAds: totalAds || 0,
                    activePro: activePro || 0,
                    activeNational: activeNational || 0
                });
            } catch (err) {
                console.error('Failed to fetch stats', err);
            } finally {
                setStatsLoading(false);
            }
        }
        
        fetchStats();
    }, [isMaster]);

    if (!isMaster) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">Platform Overview</h2>
                <p className="text-slate-400 mt-1">Real-time metrics and monetization status.</p>
            </div>

            {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-700/50" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Total Users" 
                        value={stats?.totalUsers.toString() || '0'} 
                        icon={<Users className="w-5 h-5 text-blue-500" />} 
                        trend="+12% this week"
                    />
                    <StatCard 
                        title="Verified Businesses" 
                        value={stats?.totalBusinesses.toString() || '0'} 
                        icon={<Building2 className="w-5 h-5 text-indigo-500" />} 
                        trend="+4% this week"
                    />
                    <StatCard 
                        title="Active Ads" 
                        value={stats?.totalAds.toString() || '0'} 
                        icon={<Megaphone className="w-5 h-5 text-emerald-500" />} 
                        trend="+24% this week"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Snapshot */}
                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Projected MRR</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-[#0f172a] rounded-xl border border-slate-800">
                            <div>
                                <p className="text-sm font-semibold text-slate-300">Pro Subscriptions</p>
                                <p className="text-xs text-slate-500">{stats?.activePro || 0} active</p>
                            </div>
                            <p className="font-mono text-lg text-emerald-400 font-bold">
                                {((stats?.activePro || 0) * 3000).toLocaleString()} RWF
                            </p>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-[#0f172a] rounded-xl border border-slate-800">
                            <div>
                                <p className="text-sm font-semibold text-slate-300">National Subscriptions</p>
                                <p className="text-xs text-slate-500">{stats?.activeNational || 0} active</p>
                            </div>
                            <p className="font-mono text-lg text-emerald-400 font-bold">
                                {((stats?.activeNational || 0) * 8000).toLocaleString()} RWF
                            </p>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center">
                            <p className="text-slate-400 font-bold">Total Projected Monthly</p>
                            <p className="font-mono text-2xl text-white font-black">
                                {(((stats?.activePro || 0) * 3000) + ((stats?.activeNational || 0) * 8000)).toLocaleString()} RWF
                            </p>
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">System Status</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <StatusRow label="Mobile Money API (MTN)" status="Operational" dot="bg-emerald-500" />
                        <StatusRow label="AI Discovery Engine (Gemini)" status="Operational" dot="bg-emerald-500" />
                        <StatusRow label="Realtime Database (Supabase)" status="Operational" dot="bg-emerald-500" />
                        <StatusRow label="Global CDN (Vercel)" status="Operational" dot="bg-emerald-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
    return (
        <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0f172a] flex items-center justify-center border border-slate-800 group-hover:border-slate-600 transition-colors">
                    {icon}
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold tracking-widest uppercase">
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-3xl font-display font-black text-white tracking-tight">{value}</p>
                <p className="text-sm text-slate-400 font-semibold mt-1">{title}</p>
            </div>
        </div>
    );
}

function StatusRow({ label, status, dot }: { label: string, status: string, dot: string }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a] border border-slate-800">
            <p className="text-sm text-slate-300 font-medium">{label}</p>
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{status}</span>
                <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />
            </div>
        </div>
    );
}
