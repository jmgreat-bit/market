'use client';

import { useUser } from '@/hooks/useUser';
import { useSettings, Theme, Language } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import {
    User,
    LogOut,
    MapPin,
    Megaphone,
    ChevronRight,
    Loader2,
    Moon,
    Sun,
    Monitor,
    Globe,
    Navigation,
    MessageCircle,
    Bookmark,
    Zap,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function ProfilePage() {
    const { profile, isLoading, isAuthenticated, signOut } = useUser();
    const { theme, setTheme, language, setLanguage, t } = useSettings();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6">
                    <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2 font-display">{t.profile.welcome}</h1>
                <p className="text-muted-foreground text-center mb-8 max-w-xs">
                    {t.profile.signInDesc}
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Link href={ROUTES.LOGIN}>
                        <Button className="w-full bg-primary text-primary-foreground font-display font-bold">
                            {t.auth.signIn}
                        </Button>
                    </Link>
                    <Link href={ROUTES.SIGNUP}>
                        <Button variant="outline" className="w-full border-border bg-secondary text-foreground font-display hover:border-primary/50">
                            {t.auth.createAccount}
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isTrader = profile?.role === 'trader';

    return (
        <div className="min-h-screen flex flex-col items-center pb-32 md:pb-12">
            <div className="w-full max-w-2xl mx-auto px-6 pt-8 flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-[rgba(72,72,73,0.15)] relative">
                            <div className="w-full h-full geo-gradient flex items-center justify-center text-white text-2xl font-bold font-display">
                                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-display text-2xl font-bold text-foreground">
                                    {profile?.full_name || 'User'}
                                </h2>
                                {isTrader && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Verified
                                    </span>
                                )}
                            </div>
                            {profile?.username && (
                                <p className="text-primary text-sm font-medium">@{profile.username}</p>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span>{profile?.email || profile?.phone || ''}</span>
                            </div>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:text-primary transition-colors">
                        <Bookmark className="w-5 h-5" />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 w-full">
                    <button className="flex-1 bg-primary text-primary-foreground font-display font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                        <Navigation className="w-5 h-5" />
                        Navigate
                    </button>
                    <button className="flex-1 bg-secondary border border-border text-foreground font-display font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:border-primary/50 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        Message
                    </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card rounded-lg p-4 border border-border">
                        <div className="text-muted-foreground text-xs mb-1">Status</div>
                        <div className="text-primary font-display font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Online
                        </div>
                    </div>
                    <div className="bg-card rounded-lg p-4 border border-border">
                        <div className="text-muted-foreground text-xs mb-1">Pulse Rating</div>
                        <div className="text-foreground font-display font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            4.9 <span className="text-muted-foreground text-sm font-normal">(0 pulses)</span>
                        </div>
                    </div>
                </div>

                {/* Theme Switcher Card */}
                <div className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 border border-[rgba(72,72,73,0.15)]">
                    <div className="flex items-center gap-2 mb-4">
                        <Monitor className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-display text-lg font-semibold text-foreground">{t.profile.theme}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {(['light', 'dark', 'midnight'] as Theme[]).map((tValue) => (
                            <button
                                key={tValue}
                                onClick={() => setTheme(tValue)}
                                className={`
                                    flex flex-col items-center justify-center p-4 rounded-xl transition-all cursor-pointer
                                    ${theme === tValue
                                        ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                                        : 'bg-secondary border border-border text-muted-foreground hover:bg-muted'}
                                `}
                            >
                                {tValue === 'light' && <Sun className="w-6 h-6 mb-2" />}
                                {tValue === 'dark' && <Moon className="w-6 h-6 mb-2" />}
                                {tValue === 'midnight' && <Monitor className="w-6 h-6 mb-2" />}
                                <span className="font-display text-sm font-medium capitalize">{t.themes[tValue]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language Switcher Card */}
                <div className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 border border-[rgba(72,72,73,0.15)]">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-display text-lg font-semibold text-foreground">{t.profile.language}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {(['en', 'es', 'fr'] as Language[]).map((lValue) => (
                            <button
                                key={lValue}
                                onClick={() => setLanguage(lValue)}
                                className={`
                                    flex flex-col items-center justify-center p-3 rounded-xl transition-all
                                    ${language === lValue
                                        ? 'bg-primary/10 border border-primary/30 text-primary'
                                        : 'bg-[#1a191b]/30 border border-[rgba(72,72,73,0.15)] text-muted-foreground hover:bg-[#1a191b]/50'}
                                `}
                            >
                                <span className="text-lg mb-1">
                                    {lValue === 'en' ? '🇺🇸' : lValue === 'es' ? '🇪🇸' : '🇫🇷'}
                                </span>
                                <span className="text-xs font-medium">{t.languages[lValue]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Trader Actions */}
                {isTrader && (
                    <div className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl border border-[rgba(72,72,73,0.15)] overflow-hidden">
                        <div className="p-4 border-b border-[rgba(72,72,73,0.15)]">
                            <h3 className="font-display font-semibold text-foreground">{t.profile.manageBusiness}</h3>
                        </div>
                        <button className="w-full flex items-center gap-3 p-4 hover:bg-[#1a191b]/80 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-display font-medium text-foreground">{t.profile.createShout}</p>
                                <p className="text-xs text-muted-foreground">{t.auth.traderDesc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                )}

                {/* Sign Out */}
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 p-4 bg-[#1a191b]/50 border border-[rgba(72,72,73,0.15)] rounded-xl hover:bg-red-500/10 hover:border-red-500/20 transition-all text-destructive"
                >
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-display font-medium">{t.profile.signOut}</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
