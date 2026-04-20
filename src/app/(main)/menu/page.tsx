'use client';

import { useUser } from '@/hooks/useUser';
import { useSettings, Theme, Language } from '@/contexts/SettingsContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
    User, 
    LogOut, 
    Bookmark, 
    BarChart3, 
    Settings, 
    HelpCircle, 
    FileText, 
    ChevronRight,
    Loader2,
    Moon,
    Sun,
    Monitor,
    Globe,
    CheckCircle2,
    Shield
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function MenuPage() {
    const { profile, isLoading, isAuthenticated, signOut } = useUser();
    const { theme, setTheme, language, setLanguage, t } = useSettings();
    const router = useRouter();

    // Redirect to login if not authenticated (middleware should handle this, but as a safety net)
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace(ROUTES.LOGIN);
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isTrader = profile?.role === 'trader';

    return (
        <div className="min-h-screen bg-surface text-foreground pb-32">
            <div className="max-w-2xl mx-auto px-6 pt-10 space-y-8">
                
                {/* Profile Header HUD */}
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full geo-gradient p-[2px]">
                            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-headline text-3xl font-bold uppercase">
                                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                                </div>
                            </div>
                        </div>
                            <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-full border-2 border-surface shadow-lg">
                                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            </div>
                    </div>
                    <div>
                        <h2 className="font-headline text-2xl font-black tracking-tight">{profile?.full_name || 'User'}</h2>
                        <p className="text-primary text-sm font-medium tracking-wide">@{profile?.username || 'explorer'}</p>
                        <div className="flex items-center gap-2 mt-1 px-2 py-0.5 rounded-full bg-secondary border border-border/50 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Pulse</span>
                        </div>
                    </div>
                </div>

                {/* Main Hub Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Navigation Hub</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <MenuButton 
                            icon={<Bookmark className="w-5 h-5" />} 
                            label="Saved Pulses" 
                            desc="Managed bookmarks" 
                        />
                        <MenuButton 
                            icon={<BarChart3 className="w-5 h-5" />} 
                            label="Analytics" 
                            desc={isTrader ? "Business insights" : "Discovery stats"} 
                            locked={!isTrader}
                        />
                        <MenuButton 
                            icon={<User className="w-5 h-5" />} 
                            label="Edit Profile" 
                            desc="Update identity" 
                        />
                        <MenuButton 
                            icon={<Shield className="w-5 h-5" />} 
                            label="Security" 
                            desc="Auth settings" 
                        />
                    </div>
                </div>

                {/* System Settings HUD */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">System Customization</h3>
                    
                    {/* Theme Switcher */}
                    <div className="glass-card rounded-[2rem] border border-border/50 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Monitor className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="font-headline font-bold text-sm tracking-tight">Interface Theme</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['light', 'dark', 'midnight'] as Theme[]).map((tValue) => (
                                <button
                                    key={tValue}
                                    onClick={() => setTheme(tValue)}
                                    className={`
                                        flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all
                                        ${theme === tValue
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'bg-secondary border border-border/50 text-muted-foreground hover:bg-secondary-foreground/10'}
                                    `}
                                >
                                    {tValue === 'light' ? <Sun className="w-4 h-4 mb-2" /> : tValue === 'dark' ? <Moon className="w-4 h-4 mb-2" /> : <Monitor className="w-4 h-4 mb-2" />}
                                    <span className="text-[10px] uppercase tracking-widest">{tValue}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Hub */}
                    <div className="glass-card rounded-[2rem] border border-border/50 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="font-headline font-bold text-sm tracking-tight">Locale & Language</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['en', 'es', 'fr'] as Language[]).map((lValue) => (
                                <button
                                    key={lValue}
                                    onClick={() => setLanguage(lValue)}
                                    className={`
                                        flex items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all
                                        ${language === lValue
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'bg-secondary border border-border/50 text-muted-foreground hover:bg-secondary-foreground/10'}
                                    `}
                                >
                                    <span className="text-xs uppercase font-bold tracking-widest">{lValue}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Additional Links */}
                <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Information</h3>
                    <div className="bg-card rounded-[1.5rem] border border-border/50 overflow-hidden">
                        <InfoLink icon={<HelpCircle />} label="Help Center" />
                        <InfoLink icon={<FileText />} label="Terms of Service" />
                        <InfoLink icon={<Settings />} label="Privacy Policy" />
                    </div>
                </div>

                {/* Terminal Action */}
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-4 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl hover:bg-destructive text-white transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center group-hover:bg-destructive-foreground/20 transition-colors">
                        <LogOut className="w-5 h-5 text-destructive group-hover:text-white" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-headline font-bold text-destructive group-hover:text-white transition-colors">Terminate Session</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest group-hover:text-white/60 transition-colors">Secure sign out</p>
                    </div>
                </button>

            </div>
        </div>
    );
}

function MenuButton({ icon, label, desc, locked = false }: { icon: any, label: string, desc: string, locked?: boolean }) {
    return (
        <button 
            disabled={locked}
            className={`
                flex flex-col items-start gap-4 p-5 rounded-[2rem] border transition-all text-left group
                ${locked 
                    ? 'bg-secondary border-border/50 opacity-50 grayscale cursor-not-allowed' 
                    : 'glass-card border-border/50 hover:border-primary/40 active:scale-95'}
            `}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${locked ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                {icon}
            </div>
            <div>
                <p className="font-headline font-bold text-sm text-foreground mb-0.5">{label}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{desc}</p>
            </div>
        </button>
    );
}

function InfoLink({ icon, label }: { icon: any, label: string }) {
    return (
        <button className="w-full flex items-center justify-between p-4 px-6 hover:bg-secondary-foreground/5 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    {icon}
                </div>
                <span className="font-medium text-sm text-foreground">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
        </button>
    );
}
