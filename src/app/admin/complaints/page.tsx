'use client';

import { useAdmin } from '@/hooks/useAdmin';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function AdminComplaintsPage() {
    const { isAdmin } = useAdmin();

    if (!isAdmin) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">Complaints & Moderation</h2>
                <p className="text-slate-400 mt-1">Review flagged posts and user reports.</p>
            </div>

            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Zero Active Complaints</h3>
                <p className="text-slate-400 max-w-sm mx-auto">
                    Your community is healthy! There are currently no pending reports or flagged content requiring moderation.
                </p>
            </div>
        </div>
    );
}
