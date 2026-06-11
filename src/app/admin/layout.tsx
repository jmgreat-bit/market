'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2, LayoutDashboard, Users, AlertOctagon, LogOut, Shield } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isMaster, isLoading, role } = useAdmin();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.replace(ROUTES.HOME);
        }
    }, [isLoading, isAdmin, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAdmin) {
        return null; // Will redirect
    }

    const navItems = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard, show: isMaster },
        { name: 'Users', href: '/admin/users', icon: Users, show: true },
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
