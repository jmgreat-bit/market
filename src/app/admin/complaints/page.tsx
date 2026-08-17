'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CheckCircle2, Bug, Flag, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SupportTicket {
    id: string;
    category: 'help' | 'software' | 'report';
    subject: string;
    message: string;
    reference_type: string | null;
    reference_id: string | null;
    created_at: string;
}

export default function AdminComplaintsPage() {
    const { isAdmin } = useAdmin();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!isAdmin) return;

        async function fetchTickets() {
            const supabase = getSupabaseClient();
            const { data } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (data) setTickets(data as SupportTicket[]);
            setLoading(false);
        }

        fetchTickets();
    }, [isAdmin]);

    if (!isAdmin) return null;

    const filteredTickets = tickets.filter(t => activeTab === 'all' || t.category === activeTab);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">Complaints & Moderation</h2>
                <p className="text-slate-400 mt-1">Review user reports and support tickets.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#1e293b]/50 border border-slate-700/50 p-1 mb-8 w-full justify-start overflow-x-auto h-auto">
                    <TabsTrigger value="all" className="px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">All Tickets</TabsTrigger>
                    <TabsTrigger value="report" className="px-6 py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-lg transition-all">
                        <div className="flex items-center gap-2"><Flag className="w-4 h-4" /> Reports</div>
                    </TabsTrigger>
                    <TabsTrigger value="software" className="px-6 py-2.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg transition-all">
                        <div className="flex items-center gap-2"><Bug className="w-4 h-4" /> Bugs</div>
                    </TabsTrigger>
                    <TabsTrigger value="help" className="px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
                        <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Help</div>
                    </TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="text-center py-12 text-slate-500 animate-pulse">Loading tickets...</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Zero Active Tickets Here</h3>
                        <p className="text-slate-400 max-w-sm mx-auto">
                            No tickets found for this category.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredTickets.map(ticket => (
                            <div key={ticket.id} className="bg-[#1e293b]/50 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            ticket.category === 'report' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            ticket.category === 'software' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                        }`}>
                                            {ticket.category === 'report' ? <Flag className="w-5 h-5" /> :
                                             ticket.category === 'software' ? <Bug className="w-5 h-5" /> :
                                             <HelpCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{ticket.subject}</h3>
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                                                <span>{ticket.category}</span>
                                                <span>•</span>
                                                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800 text-slate-300 text-sm whitespace-pre-wrap">
                                    {ticket.message}
                                </div>
                                {ticket.reference_id && (
                                    <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-400">
                                        <span className="font-bold text-slate-300 uppercase">Target {ticket.reference_type}:</span> {ticket.reference_id}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Tabs>
        </div>
    );
}
