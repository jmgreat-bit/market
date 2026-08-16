'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Users, Building2, Megaphone, TrendingUp, DollarSign, Calendar, Activity, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
    usersOverTime: { date: string, signups: number }[];
    revenueOverTime: { date: string, revenue: number }[];
    peakUsage: { hour: string, searches: number, views: number }[];
    topSearches: { query: string, count: number }[];
    overview: {
        totalUsers: number;
        totalBusinesses: number;
        totalAds: number;
        mrr: number;
    }
}

export default function AdminOverviewPage() {
    const { isMaster, isLoading, role } = useAdmin();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7d'); // 'today', '7d', '30d', 'all'

    useEffect(() => {
        if (!isLoading && !isMaster && role !== 'staff') {
            router.replace('/admin/users');
        }
    }, [isLoading, isMaster, role, router]);

    useEffect(() => {
        if (!isMaster && role !== 'staff') return;

        async function fetchAnalytics() {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error('Failed to fetch analytics', err);
            } finally {
                setLoading(false);
            }
        }
        
        fetchAnalytics();
    }, [isMaster, role, dateRange]);

    if (!isMaster && role !== 'staff') return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-black text-white tracking-tight">Platform Analytics</h2>
                    <p className="text-slate-400 mt-1">Comprehensive oversight of platform usage, growth, and monetization.</p>
                </div>
                
                {/* Date Range Selector */}
                <div className="flex items-center bg-[#0f172a] p-1 rounded-lg border border-slate-700/50">
                    {[
                        { id: 'today', label: 'Today' },
                        { id: '7d', label: '7 Days' },
                        { id: '30d', label: '30 Days' },
                        { id: 'all', label: 'All Time' }
                    ].map(range => (
                        <button
                            key={range.id}
                            onClick={() => setDateRange(range.id)}
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                dateRange === range.id 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-[#1e293b]/50 border border-slate-700/50 p-1 mb-8 w-full justify-start overflow-x-auto h-auto">
                    <TabsTrigger value="overview" className="px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">Overview</TabsTrigger>
                    <TabsTrigger value="growth" className="px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">Growth & Usage</TabsTrigger>
                    <TabsTrigger value="insights" className="px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">Insights</TabsTrigger>
                    {isMaster && (
                        <TabsTrigger value="financials" className="px-6 py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg transition-all">Financials</TabsTrigger>
                    )}
                </TabsList>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50" />)}
                    </div>
                ) : (
                    <>
                        {/* ── OVERVIEW TAB ── */}
                        <TabsContent value="overview" className="space-y-6 m-0 focus:outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Total Users" value={data?.overview.totalUsers.toString() || '0'} icon={<Users className="text-blue-500" />} />
                                <StatCard title="Verified Businesses" value={data?.overview.totalBusinesses.toString() || '0'} icon={<Building2 className="text-indigo-500" />} />
                                <StatCard title="Active Ads" value={data?.overview.totalAds.toString() || '0'} icon={<Megaphone className="text-amber-500" />} />
                                {isMaster && (
                                    <StatCard title="Projected MRR" value={`${data?.overview.mrr.toLocaleString() || 0} RWF`} icon={<DollarSign className="text-emerald-500" />} />
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                        <TrendingUp className="w-5 h-5 text-blue-500" />
                                        Recent Growth
                                    </h3>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data?.usersOverTime}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} minTickGap={30} />
                                                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Line type="monotone" dataKey="signups" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                        <Activity className="w-5 h-5 text-indigo-500" />
                                        System Status
                                    </h3>
                                    <div className="space-y-4">
                                        <StatusRow label="Mobile Money API (MTN)" status="Operational" dot="bg-emerald-500" />
                                        <StatusRow label="AI Discovery Engine (Gemini)" status="Operational" dot="bg-emerald-500" />
                                        <StatusRow label="Realtime Database (Supabase)" status="Operational" dot="bg-emerald-500" />
                                        <StatusRow label="Global CDN (Vercel)" status="Operational" dot="bg-emerald-500" />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── GROWTH & USAGE TAB ── */}
                        <TabsContent value="growth" className="space-y-6 m-0 focus:outline-none">
                            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    Peak Usage Times (Activity by Hour)
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">Shows when users are most actively searching and viewing profiles during the selected time period.</p>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data?.peakUsage}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                                            <Tooltip 
                                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="searches" name="Searches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="views" name="Profile Views" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── INSIGHTS TAB ── */}
                        <TabsContent value="insights" className="space-y-6 m-0 focus:outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                        <Search className="w-5 h-5 text-amber-500" />
                                        Top Search Queries
                                    </h3>
                                    <div className="space-y-3">
                                        {data?.topSearches && data.topSearches.length > 0 ? (
                                            data.topSearches.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-[#0f172a] rounded-xl border border-slate-700/50">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                                        <span className="text-white font-medium capitalize">{item.query}</span>
                                                    </div>
                                                    <span className="text-amber-500 font-bold">{item.count}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 text-center py-8">No search data for this period.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── FINANCIALS TAB ── */}
                        {isMaster && (
                            <TabsContent value="financials" className="space-y-6 m-0 focus:outline-none">
                                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                        <DollarSign className="w-5 h-5 text-emerald-500" />
                                        Completed Payments (Revenue)
                                    </h3>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data?.revenueOverTime}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} minTickGap={30} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v/1000)}k`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: any) => [`${(value || 0).toLocaleString()} RWF`, 'Revenue']}
                                                />
                                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </TabsContent>
                        )}
                    </>
                )}
            </Tabs>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0f172a] flex items-center justify-center border border-slate-800">
                    {icon}
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
