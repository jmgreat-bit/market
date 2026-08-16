'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AdWithDetails } from '@/hooks/useAds';
import { Check, X, Megaphone, Loader2 } from 'lucide-react';

export default function AdminAdsPage() {
    const { isAdmin } = useAdmin();
    const [ads, setAds] = useState<AdWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!isAdmin) return;
        fetchAds();
    }, [isAdmin]);

    async function fetchAds() {
        setLoading(true);
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('ads')
            .select(`
                *,
                post:posts(id, content, image_url, created_at),
                business:business_details(business_name, category, profile_id)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (data) setAds(data as AdWithDetails[]);
        setLoading(false);
    }

    const handleAction = async (adId: string, newStatus: 'active' | 'cancelled') => {
        setActionLoading(adId);
        const supabase = getSupabaseClient();
        
        const { error } = await supabase
            .from('ads')
            .update({ status: newStatus })
            .eq('id', adId);

        if (!error) {
            setAds(prev => prev.filter(ad => ad.id !== adId));
        } else {
            console.error('Failed to update ad status:', error);
            alert('Failed to update ad. Please try again.');
        }
        setActionLoading(null);
    };

    if (!isAdmin) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">Ad Moderation Queue</h2>
                <p className="text-slate-400 mt-1">Review and approve user-submitted advertisements.</p>
            </div>

            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0f172a] border-b border-slate-700/50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                            <tr>
                                <th className="px-6 py-4">Advertiser</th>
                                <th className="px-6 py-4 min-w-[300px]">Ad Content Preview</th>
                                <th className="px-6 py-4">Targeting</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading pending ads...</td>
                                </tr>
                            ) : ads.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <Megaphone className="w-12 h-12 text-slate-700 mb-4" />
                                            <p>No ads waiting for review.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : ads.map(ad => (
                                <tr key={ad.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-white font-semibold">{ad.business?.business_name}</p>
                                        <p className="text-xs text-slate-500">{ad.business?.category}</p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-700/50">
                                            <p className="text-slate-300 line-clamp-2 mb-2">{ad.post?.content}</p>
                                            {ad.post?.image_url && (
                                                <img 
                                                    src={ad.post.image_url} 
                                                    alt="Ad visual" 
                                                    className="w-full h-32 object-cover rounded border border-slate-700/50" 
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-300">
                                                <span className="text-slate-500">Reach:</span> {ad.is_nationwide ? 'Nationwide' : `${ad.radius_km} km`}
                                            </p>
                                            <p className="text-xs text-slate-300">
                                                <span className="text-slate-500">Placements:</span> {ad.placements.join(', ')}
                                            </p>
                                            <p className="text-xs text-slate-300">
                                                <span className="text-slate-500">Cost:</span> {ad.total_cost} RWF
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top text-right space-y-2">
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleAction(ad.id, 'active')}
                                                disabled={actionLoading === ad.id}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                            >
                                                {actionLoading === ad.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(ad.id, 'cancelled')}
                                                disabled={actionLoading === ad.id}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                            >
                                                {actionLoading === ad.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                                Reject
                                            </button>
                                        </div>
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
