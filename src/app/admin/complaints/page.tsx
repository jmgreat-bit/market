'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CheckCircle2, Bug, Flag, HelpCircle, User, Mail, ExternalLink, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface SubmitterProfile {
    id: string;
    full_name: string | null;
    username: string | null;
    email: string;
    avatar_url: string | null;
    role?: string;
}

interface SupportTicket {
    id: string;
    user_id: string | null;
    category: 'help' | 'software' | 'report';
    subject: string;
    message: string;
    reference_type: string | null;
    reference_id: string | null;
    created_at: string;
    profiles?: SubmitterProfile | null;
}

export default function AdminComplaintsPage() {
    const { isAdmin } = useAdmin();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [ticketStatus, setTicketStatus] = useState<'open' | 'resolved'>('open');

    useEffect(() => {
        if (!isAdmin) return;

        async function fetchTickets() {
            setLoading(true);
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*, profiles:user_id(id, full_name, username, email, avatar_url, role)')
                .eq('status', ticketStatus)
                .order(ticketStatus === 'resolved' ? 'updated_at' : 'created_at', { ascending: false });
            
            if (data) {
                setTickets(data as unknown as SupportTicket[]);
            } else if (error) {
                console.error('Error fetching tickets with profiles:', error);
                // Fallback query if relation join fails
                const { data: fallbackData } = await supabase
                    .from('support_tickets')
                    .select('*')
                    .eq('status', ticketStatus)
                    .order('created_at', { ascending: false });
                if (fallbackData) setTickets(fallbackData as SupportTicket[]);
            }
            setLoading(false);
        }

        fetchTickets();
    }, [isAdmin, ticketStatus]);

    if (!isAdmin) return null;

    const handleResolve = async (id: string) => {
        const supabase = getSupabaseClient();
        // Optimistically remove from UI
        setTickets(tickets.filter(t => t.id !== id));
        // Update in database
        await supabase
            .from('support_tickets')
            .update({ status: 'resolved' })
            .eq('id', id);
    };

    const filteredTickets = tickets.filter(t => activeTab === 'all' || t.category === activeTab);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-black text-white tracking-tight">Complaints & Moderation</h2>
                    <p className="text-slate-400 mt-1">Review user reports, submitter details, and support tickets.</p>
                </div>

                <div className="flex p-1 bg-[#1e293b]/50 border border-slate-700/50 rounded-lg">
                    <button 
                        onClick={() => setTicketStatus('open')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${ticketStatus === 'open' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Active Tickets
                    </button>
                    <button 
                        onClick={() => setTicketStatus('resolved')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${ticketStatus === 'resolved' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Resolved History
                    </button>
                </div>
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
                    <div className="text-center py-12 text-slate-500 animate-pulse">Loading tickets & users...</div>
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
                    <div className="grid gap-5">
                        {filteredTickets.map(ticket => {
                            const submitter = ticket.profiles;

                            return (
                                <div key={ticket.id} className="bg-[#1e293b]/60 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-500/80 transition-all shadow-lg">
                                    {/* Top: Ticket Category & Submitter Info */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-700/50">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2.5 rounded-xl shrink-0 ${
                                                ticket.category === 'report' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                ticket.category === 'software' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                                {ticket.category === 'report' ? <Flag className="w-5 h-5" /> :
                                                 ticket.category === 'software' ? <Bug className="w-5 h-5" /> :
                                                 <HelpCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white leading-snug">{ticket.subject}</h3>
                                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                                                    <span>{ticket.category}</span>
                                                    <span>•</span>
                                                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submitter Card */}
                                        <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 flex items-center justify-between sm:justify-start gap-3 shrink-0">
                                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                                                {submitter?.avatar_url ? (
                                                    <img src={submitter.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-bold text-white">
                                                        {submitter?.full_name || 'Anonymous User'}
                                                    </p>
                                                    {submitter?.role && (
                                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                            {submitter.role}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-mono">
                                                    {submitter?.email || 'No email attached'}
                                                </p>
                                            </div>

                                            {submitter?.email && (
                                                <a 
                                                    href={`mailto:${submitter.email}?subject=Re: ${encodeURIComponent(ticket.subject)} - SynchroMarket Support`}
                                                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors ml-1"
                                                    title={`Reply directly to ${submitter.email}`}
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </a>
                                            )}

                                            {submitter?.username && (
                                                <Link
                                                    href={`/u/${submitter.username}`}
                                                    target="_blank"
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                                    title="View Public Profile"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Body */}
                                    <div className="mt-4 bg-[#0f172a] p-4 rounded-xl border border-slate-800/80 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                                        {ticket.message}
                                    </div>

                                    {/* Target Content Link (for Reports) */}
                                    {ticket.reference_id && (
                                        <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between gap-4 flex-wrap">
                                            <div className="text-xs text-slate-400">
                                                <span className="font-bold text-slate-300 uppercase">Target {ticket.reference_type}:</span> {ticket.reference_id}
                                            </div>
                                            <Link 
                                                href={ticket.reference_type === 'user' ? `/u/${ticket.reference_id}` : `/p/${ticket.reference_id}`}
                                                target="_blank"
                                                className="px-3 py-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
                                            >
                                                View Reported Content ↗
                                            </Link>
                                        </div>
                                    )}

                                    {/* Resolve Action */}
                                    {ticketStatus === 'open' && (
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={() => handleResolve(ticket.id)}
                                                className="px-4 py-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Mark Resolved
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Tabs>
        </div>
    );
}
