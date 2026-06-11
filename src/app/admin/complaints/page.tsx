'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AlertOctagon, CheckCircle2, Ticket, Bug, Flag, HelpCircle } from 'lucide-react';

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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">Complaints & Moderation</h2>
                <p className="text-slate-400 mt-1">Review user reports and support tickets.</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500 animate-pulse">Loading tickets...</div>
            ) : tickets.length === 0 ? (
                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Zero Active Complaints</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">
                        Your community is healthy! There are currently no pending reports or tickets.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tickets.map(ticket => (
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
        </div>
    );
}
