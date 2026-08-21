'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2, LayoutDashboard, Users, AlertOctagon, LogOut, Shield, Megaphone, Building2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isMaster, isLoading, role, user } = useAdmin();
    const router = useRouter();
    const pathname = usePathname();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-[#1e293b]/80 backdrop-blur-xl border border-blue-900/40 p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Shield className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="font-display font-black text-2xl tracking-tight text-white">Admin Access Required</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            You are currently signed in as <span className="text-blue-400 font-semibold">{user?.email || 'Guest'}</span>, which does not have Admin privileges.
                        </p>
                    </div>

                    <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 text-xs text-slate-400 text-left space-y-2">
                        <p className="font-bold text-white uppercase tracking-wider text-[10px]">Authorized Admin Email:</p>
                        <p>• Master Admin: <code className="text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded">thegreat@admin.sir</code></p>
                        <p>• Staff Accounts: <code className="text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded">*@staff.synchromarket.com</code></p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Link
                            href="/auth/login"
                            className="block w-full py-3.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/25"
                        >
                            Log In with Admin Account
                        </Link>
                        <Link
                            href={ROUTES.HOME}
                            className="block w-full py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                        >
                            Return to Main App
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const navItems = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard, show: isMaster },
        { name: 'Users', href: '/admin/users', icon: Users, show: true },
        { name: 'Ads Queue', href: '/admin/ads', icon: Megaphone, show: true },
        { name: 'Markets', href: '/admin/markets', icon: Building2, show: true },
        { name: 'Complaints', href: '/admin/complaints', icon: AlertOctagon, show: true },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col md:flex-row font-sans">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-[#020617] border-b md:border-b-0 md:border-r border-blue-900/30 flex flex-col">
                <div className="p-6 border-b border-blue-900/30">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <h1 className="font-display font-black text-xl tracking-tight text-white">MarketAdmin</h1>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-600/10 text-blue-500 border border-blue-600/20">
                        {role} Access
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.filter(item => item.show).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                                    isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-blue-900/30">
                    <Link
                        href={ROUTES.HOME}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <LogOut className="w-5 h-5 text-slate-500" />
                        Exit to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
