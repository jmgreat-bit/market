'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Search, Shield, Building2, User } from 'lucide-react';
import { Profile } from '@/types';

export default function AdminUsersPage() {
    const { isAdmin } = useAdmin();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) return;

        async function fetchUsers() {
            setLoading(true);
            const supabase = getSupabaseClient();
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (data) setUsers(data as Profile[]);
            setLoading(false);
        }

        fetchUsers();
    }, [isAdmin]);

    if (!isAdmin) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-black text-white tracking-tight">User Management</h2>
                    <p className="text-slate-400 mt-1">View and manage platform accounts.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="bg-[#0f172a] border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0f172a] border-b border-slate-700/50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Tier</th>
                                <th className="px-6 py-4">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No users found.</td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-slate-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">{user.full_name || 'Anonymous'}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            {user.role === 'trader' ? <Building2 className="w-4 h-4 text-indigo-400" /> : <User className="w-4 h-4 text-slate-400" />}
                                            <span className="capitalize">{user.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                            user.trader_tier === 'national' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            user.trader_tier === 'pro' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                            'bg-slate-800 text-slate-400'
                                        }`}>
                                            {user.trader_tier || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
