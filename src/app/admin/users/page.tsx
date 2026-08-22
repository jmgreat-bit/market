'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Search, Shield, Building2, User, Clock, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { Profile } from '@/types';

export default function AdminUsersPage() {
    const { isAdmin } = useAdmin();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (data) setUsers(data as Profile[]);
        setLoading(false);
    };

    useEffect(() => {
        if (!isAdmin) return;
        fetchUsers();
    }, [isAdmin]);

    if (!isAdmin) return null;

    const handleRevokeTier = async (userId: string) => {
        if (!confirm('Are you sure you want to reset this user tier back to Free?')) return;
        setActionLoading(userId);

        try {
            const supabase = getSupabaseClient();
            await supabase
                .from('profiles')
                .update({
                    trader_tier: 'free',
                    is_premium: false,
                    tier_expires_at: null,
                })
                .eq('id', userId);

            setUsers(users.map(u => u.id === userId ? { ...u, trader_tier: 'free', is_premium: false, tier_expires_at: null } : u));
        } catch (err) {
            console.error('Failed to revoke tier:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getDaysRemaining = (expiresAt: string | null) => {
        if (!expiresAt) return null;
        const diffMs = new Date(expiresAt).getTime() - new Date().getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return days;
    };

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            (user.full_name && user.full_name.toLowerCase().includes(query)) ||
            (user.email && user.email.toLowerCase().includes(query)) ||
            (user.username && user.username.toLowerCase().includes(query)) ||
            (user.trader_tier && user.trader_tier.toLowerCase().includes(query))
        );
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-black text-white tracking-tight">User & Subscription Management</h2>
                    <p className="text-slate-400 mt-1">Monitor accounts, active Pro tiers, promo expirations, and access.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name, email, tier..." 
                        className="bg-[#0f172a] border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors w-full sm:w-72"
                    />
                </div>
            </div>

            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0f172a] border-b border-slate-700/50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Subscription Tier</th>
                                <th className="px-6 py-4">Tier Expiration</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No matching users found.</td>
                                </tr>
                            ) : filteredUsers.map(user => {
                                const daysLeft = getDaysRemaining(user.tier_expires_at);
                                const isTierActive = user.trader_tier && user.trader_tier !== 'free';

                                return (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                        {/* User Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-semibold flex items-center gap-1.5">
                                                        {user.full_name || 'Anonymous'}
                                                        {user.username && <span className="text-xs text-slate-500 font-normal">(@{user.username})</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
                                                {user.role === 'trader' ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" /> Trader
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 flex items-center gap-1">
                                                        <User className="w-3 h-3" /> Client
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Tier */}
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                user.trader_tier === 'national' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                                user.trader_tier === 'pro' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]' :
                                                'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                                            }`}>
                                                {user.trader_tier ? user.trader_tier.toUpperCase() : 'FREE'}
                                            </span>
                                        </td>

                                        {/* Expiration Tracking */}
                                        <td className="px-6 py-4">
                                            {isTierActive && user.tier_expires_at ? (
                                                <div>
                                                    {daysLeft !== null && daysLeft > 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                                            <Clock className="w-3 h-3" /> {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                                                            <AlertTriangle className="w-3 h-3" /> Expired
                                                        </span>
                                                    )}
                                                    <p className="text-[10px] text-slate-500 mt-1">
                                                        Until {new Date(user.tier_expires_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ) : isTierActive ? (
                                                <span className="text-xs text-blue-300 font-medium">Lifetime / Paid</span>
                                            ) : (
                                                <span className="text-xs text-slate-500">—</span>
                                            )}
                                        </td>

                                        {/* Joined */}
                                        <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            {isTierActive ? (
                                                <button
                                                    onClick={() => handleRevokeTier(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="px-3 py-1 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                                                    title="Reset to Free Tier"
                                                >
                                                    {actionLoading === user.id ? 'Resetting...' : 'Revoke Tier'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-600">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
