'use client';

import { useUser } from '@/hooks/useUser';
import { useSettings, Theme, Language } from '@/contexts/SettingsContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { 
    User, 
    LogOut, 
    Bookmark, 
    BarChart3, 
    Settings, 
    HelpCircle, 
    FileText, 
    ChevronRight,
    Moon,
    Sun,
    Monitor,
    Globe,
    CheckCircle2,
    Shield,
    MessageCircleQuestion,
    Compass,
    Crown
} from 'lucide-react';

export default function MenuPage() {
    const { profile, user, isLoading, signOut, isAuthenticated } = useUser();
    const { theme, setTheme, language, setLanguage, t } = useSettings();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/login');
        router.refresh();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Middleware will redirect
    }

    const isTrader = profile?.role === 'trader';
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
    const displayUsername = profile?.username || user?.email?.split('@')[0] || 'user';

    return (
        <div className="min-h-screen bg-surface text-foreground pb-32">
            <div className="max-w-2xl mx-auto px-6 pt-10 space-y-8">
                
                {/* Profile Header HUD */}
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full geo-gradient p-[2px]">
                            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                                {isLoading ? (
                                    <div className="w-full h-full bg-secondary animate-pulse" />
                                ) : profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-headline text-3xl font-bold uppercase">
                                        {displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                            <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-full border-2 border-surface shadow-lg">
                                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            </div>
                    </div>
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="space-y-2">
                                <div className="h-7 w-32 bg-secondary rounded animate-pulse" />
                                <div className="h-4 w-24 bg-secondary/50 rounded animate-pulse" />
                            </div>
                        ) : (
                            <>
                                <h2 className="font-headline text-xl font-black tracking-tight line-clamp-1">{displayName}</h2>
                                <p className="text-primary text-sm font-medium tracking-wide">@{displayUsername}</p>
                            </>
                        )}
                        <div className="flex items-center gap-2 mt-2 px-2 py-0.5 rounded-full bg-secondary border border-border/50 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Online</span>
                        </div>
                    </div>
                </div>

                {/* Premium Upgrade CTA */}
                <Link
                    href="/premium"
                    className="block w-full p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 hover:from-amber-500/20 hover:via-yellow-500/10 hover:to-amber-500/20 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
                            <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-headline font-bold text-sm text-foreground">Upgrade to Premium</p>
                            <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Unlock pro features</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-amber-500/60 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Main Hub Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Navigation Hub</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <MenuButton 
                            icon={<Bookmark className="w-5 h-5" />} 
                            label="Saved Posts" 
                            desc="Managed bookmarks"
                            href={ROUTES.SAVED}
                        />
                        <MenuButton 
                            icon={<BarChart3 className="w-5 h-5" />} 
                            label="Analytics" 
                            desc={isTrader ? "Business insights" : "Discovery stats"} 
                            href="/analytics"
                        />
                        <MenuButton 
                            icon={<User className="w-5 h-5" />} 
                            label="Edit Profile" 
                            desc="Update identity" 
                            href="/profile"
                        />
                        <MenuButton 
                            icon={<Shield className="w-5 h-5" />} 
                            label="Security" 
                            desc="Coming soon"
                            locked={true}
                        />
                        <MenuButton
                            icon={<MessageCircleQuestion className="w-5 h-5" />}
                            label="Support"
                            desc="Get help & report"
                            href="/support"
                        />
                        {isTrader && (
                            <MenuButton
                                icon={<Compass className="w-5 h-5" />}
                                label="Directions"
                                desc="How to find you"
                                href="/directions"
                            />
                        )}
                    </div>
                </div>

                {/* System Settings HUD */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">System Customization</h3>
                    
                    {/* Theme Switcher */}
                    <div className="glass-card rounded-xl border border-border/50 p-5 space-y-4">
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
                    <div className="glass-card rounded-xl border border-border/50 p-5 space-y-4">
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
                    <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
                        <InfoLink icon={<HelpCircle />} label="Help Center" href="/support" />
                        <InfoLink icon={<FileText />} label="Terms of Service" href="/legal/terms" />
                        <InfoLink icon={<Settings />} label="Privacy Policy" href="/legal/privacy" />
                    </div>
                </div>

                {/* Terminal Action */}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl hover:bg-destructive text-white transition-all group"
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

function MenuButton({ icon, label, desc, locked = false, href }: { icon: any, label: string, desc: string, locked?: boolean, href?: string }) {
    const Component = href && !locked ? Link : 'button';
    return (
        <Component 
            href={href as string}
            disabled={locked}
            className={`
                flex flex-col items-start gap-4 p-4 rounded-xl border transition-all text-left group
                ${locked 
                    ? 'bg-secondary border-border/50 opacity-50 grayscale cursor-not-allowed' 
                    : 'glass-card border-border/50 hover:border-primary/40 active:scale-95'}
            `}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${locked ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                {icon}
            </div>
            <div>
                <p className="font-headline font-bold text-sm text-foreground mb-0.5">{label}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{desc}</p>
            </div>
        </Component>
    );
}

function InfoLink({ icon, label, href }: { icon: any, label: string, href?: string }) {
    if (href) {
        return (
            <Link href={href} className="w-full flex items-center justify-between p-4 px-6 hover:bg-secondary-foreground/5 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                        {icon}
                    </div>
                    <span className="font-medium text-sm text-foreground">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
            </Link>
        );
    }
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
