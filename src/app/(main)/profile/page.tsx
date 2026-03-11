'use client';

import { useUser } from '@/hooks/useUser';
import { useSettings, Theme, Language } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    User,
    Settings,
    LogOut,
    MapPin,
    Megaphone,
    ChevronRight,
    Loader2,
    Moon,
    Sun,
    Monitor,
    Globe
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
                <div className="w-20 h-20 rounded-full geo-gradient flex items-center justify-center mb-6">
                    <User className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{t.profile.welcome}</h1>
                <p className="text-muted-foreground text-center mb-8 max-w-xs">
                    {t.profile.signInDesc}
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Link href={ROUTES.LOGIN}>
                        <Button className="w-full geo-gradient text-white">
                            {t.auth.signIn}
                        </Button>
                    </Link>
                    <Link href={ROUTES.SIGNUP}>
                        <Button variant="outline" className="w-full">
                            {t.auth.createAccount}
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isTrader = profile?.role === 'trader';

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="glass-card border-b border-border">
                <div className="container mx-auto max-w-2xl px-4 py-8">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                            <AvatarFallback className="geo-gradient text-white text-2xl font-bold">
                                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-foreground">
                                {profile?.full_name || 'User'}
                            </h1>
                            <p className="text-sm text-muted-foreground">{profile?.email}</p>
                            <Badge
                                variant={isTrader ? 'default' : 'secondary'}
                                className={isTrader ? 'geo-gradient text-white mt-2' : 'mt-2'}
                            >
                                {isTrader ? 'Trader' : 'Client'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto max-w-2xl px-4 py-6">
                {/* Trader actions */}
                {isTrader && (
                    <Card className="glass-card mb-6 overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h2 className="font-semibold text-foreground">{t.profile.manageBusiness}</h2>
                        </div>
                        <button className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Megaphone className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-foreground">{t.profile.createShout}</p>
                                <p className="text-xs text-muted-foreground">{t.auth.traderDesc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </Card>
                )}

                {/* Settings */}
                <Card className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-semibold text-foreground">{t.profile.settings}</h2>
                    </div>

                    {/* Theme Switcher */}
                    <div className="p-4 border-b border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Monitor className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{t.profile.theme}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['light', 'dark', 'midnight'] as Theme[]).map((tValue) => (
                                <button
                                    key={tValue}
                                    onClick={() => setTheme(tValue)}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                                        ${theme === tValue
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground'}
                                    `}
                                >
                                    {tValue === 'light' && <Sun className="w-5 h-5 mb-1" />}
                                    {tValue === 'dark' && <Moon className="w-5 h-5 mb-1" />}
                                    {tValue === 'midnight' && <Monitor className="w-5 h-5 mb-1" />}
                                    <span className="text-xs capitalize">{t.themes[tValue]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Switcher */}
                    <div className="p-4 border-b border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{t.profile.language}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['en', 'es', 'fr'] as Language[]).map((lValue) => (
                                <button
                                    key={lValue}
                                    onClick={() => setLanguage(lValue)}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                                        ${language === lValue
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground'}
                                    `}
                                >
                                    <span className="text-lg mb-1">
                                        {lValue === 'en' ? '🇺🇸' : lValue === 'es' ? '🇪🇸' : '🇫🇷'}
                                    </span>
                                    <span className="text-xs">{t.languages[lValue]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-2">
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 p-4 hover:bg-destructive/10 transition-colors text-destructive rounded-lg"
                        >
                            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium">{t.profile.signOut}</p>
                            </div>
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
