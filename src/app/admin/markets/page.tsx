'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CommercialHub } from '@/types';
import { Building2, Plus, Loader2, MapPin } from 'lucide-react';

export default function AdminMarketsPage() {
    const { isAdmin } = useAdmin();
    const [hubs, setHubs] = useState<CommercialHub[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (!isAdmin) return;
        fetchHubs();
    }, [isAdmin]);

    async function fetchHubs() {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        // Fetch hubs with business count
        const { data } = await supabase
            .from('commercial_hubs')
            .select('*')
            .order('name');
            
        if (data) {
            // Get business counts
            const hubsWithCounts = await Promise.all(data.map(async (hub: CommercialHub) => {
                const { count } = await supabase
                    .from('business_details')
                    .select('*', { count: 'exact', head: true })
                    .eq('hub_id', hub.id);
                return { ...hub, business_count: count || 0 };
            }));
            setHubs(hubsWithCounts);
        }
        setLoading(false);
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const supabase = getSupabaseClient();
        
        const { error } = await supabase.from('commercial_hubs').insert({
            name,
            description,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address
        });

        if (!error) {
            setName('');
            setDescription('');
            setLatitude('');
            setLongitude('');
            setAddress('');
            fetchHubs();
        } else {
            alert('Failed to create market: ' + error.message);
        }
        setIsCreating(false);
    };

    if (!isAdmin) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">Market Anchor Destinations</h2>
                <p className="text-slate-400 mt-1">Manage physical commercial hubs that users auto-join based on location.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1">
                    <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Plus className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-bold text-white">Create New Market</h3>
                        </div>
                        
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Market Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Kimironko Market" 
                                    className="w-full bg-[#0f172a] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                                <textarea 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Brief description of the market" 
                                    className="w-full bg-[#0f172a] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Address / Area</label>
                                <input 
                                    type="text" 
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="e.g. Gasabo, Kigali" 
                                    className="w-full bg-[#0f172a] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Latitude</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        required
                                        value={latitude}
                                        onChange={e => setLatitude(e.target.value)}
                                        placeholder="-1.9441" 
                                        className="w-full bg-[#0f172a] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Longitude</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        required
                                        value={longitude}
                                        onChange={e => setLongitude(e.target.value)}
                                        placeholder="30.0619" 
                                        className="w-full bg-[#0f172a] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50"
                                >
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
                                    Create Market
                                </button>
                                <p className="text-xs text-slate-500 text-center mt-3">Businesses within ~500m of these coordinates will automatically join this market.</p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Hubs */}
                <div className="lg:col-span-2">
                    <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-[#0f172a]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-500" />
                                Active Markets
                            </h3>
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">
                                {hubs.length} Total
                            </span>
                        </div>
                        
                        <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-12 flex justify-center text-slate-500">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                            ) : hubs.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <p>No markets created yet.</p>
                                </div>
                            ) : hubs.map(hub => (
                                <div key={hub.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                {hub.name}
                                            </h4>
                                            <p className="text-sm text-slate-400 mt-1">{hub.description}</p>
                                            
                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-[#0f172a] px-2.5 py-1 rounded-md border border-slate-700/50">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {hub.latitude}, {hub.longitude}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    <span className="font-bold text-white">{hub.business_count}</span> businesses
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
