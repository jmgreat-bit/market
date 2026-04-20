'use client';

import { 
    Menu, 
    Store, 
    Megaphone, 
    ShieldCheck, 
    Users, 
    HelpCircle, 
    Eye, 
    TrendingUp, 
    TrendingDown,
    Activity, 
    Footprints, 
    ArrowRight 
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AnalyticsDashboardPage() {
    const { metrics, isLoading } = useAnalytics();

    return (
        <div className="font-sans min-h-screen flex flex-col antialiased relative selection:bg-primary/30 selection:text-primary pb-24 md:pb-0 md:pl-72 bg-surface">
            {/* ... Mobile TopAppBar and Desktop Sidebar remain standard UI ... */}
            <header className="fixed top-0 w-full z-40 flex justify-between items-center px-6 py-4 bg-[#0e0e0f]/80 backdrop-blur-xl border-b border-[rgba(72,72,73,0.1)] md:hidden">
                <button className="text-primary hover:text-primary/80 transition-colors active:scale-95 duration-200 p-2">
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="font-display tracking-widest uppercase text-xl font-bold text-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">NAVIGATOR</h1>
                <div className="w-10 h-10 rounded-full bg-[#1a191b] overflow-hidden ring-1 ring-[rgba(72,72,73,0.3)] text-primary hover:text-primary/80 transition-colors active:scale-95 duration-200">
                    <img 
                        alt="Trader Profile" 
                        className="w-full h-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA28uL-vbQbN3B2T7Mzwb40EqiIVmZ07hWsZOlbwK17vm5Bh9h7Wkai5zSKjx34SSq-51FvY-BQHVg6DuAM1_GHyWyrueliy1G25jp5owgqNXEt6yqf7Rr8yqjbhhlxDr9DTSK-QIvLvSCJwALRqH5oArfQXaR4berxIDWnd2Bz53uLsNFjLQpXuphhj7cHmGZiitwmdKqt24gKrWV2iBgRhF5YHEQFkpLygIiDgr08iM24dPSKOfYK9kbInjVAgY4T2DF1siCX94I" 
                    />
                </div>
            </header>

            {/* Desktop Side NavigationDrawer */}
            <aside className="hidden md:flex flex-col bg-[#0e0e0f] rounded-r-3xl h-full shadow-2xl shadow-cyan-900/20 divide-y divide-[rgba(72,72,73,0.2)] max-w-[300px] w-full fixed left-0 top-0 z-[60] overflow-y-auto">
                <div className="p-6 flex items-center gap-4">
                    <img 
                        alt="Merchant Logo" 
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/50" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-YtJkrXSyskoqCHbFMaoEkkkyoiR7vBmIp5uUuDYsF9JQQ7-aHHXRbp2wfpu51vkAnO62LyN-CzFY3UT-r5gVEEg3U1i6rWompI5EED8LIOJwv22qoHyxwc22DDqZ80V2EvtWCzpfemyxa4jrZldRCoXhXcvyRdbY6gQjVxQZKmWz1y5L0qniglHuTwGeDKa_dqqu767-2xgU2DtGVV56nzhom_cRA53S_Rb65mlDzwxd1VadPgTMib4iVLGdEXRsecafNOYDpLM" 
                    />
                    <div>
                        <h2 className="font-display font-bold text-lg text-foreground">Apex Trading Co.</h2>
                        <p className="font-sans text-sm text-primary">Premium Tier Explorer</p>
                        <p className="font-sans text-xs text-muted-foreground mt-1">ID: 99283-X</p>
                    </div>
                </div>
                <nav className="flex-1 py-4 flex flex-col font-display">
                    <a className="flex items-center gap-4 px-6 py-4 bg-primary/10 text-primary font-bold border-l-4 border-primary transition-transform duration-300" href="#">
                        <Store className="w-6 h-6" />
                        Business Profile
                    </a>
                    <a className="flex items-center gap-4 px-6 py-4 text-muted-foreground hover:bg-[#1a191b] transition-colors duration-300" href="#">
                        <Megaphone className="w-6 h-6" />
                        Ad Manager
                    </a>
                    <a className="flex items-center gap-4 px-6 py-4 text-muted-foreground hover:bg-[#1a191b] transition-colors duration-300" href="#">
                        <ShieldCheck className="w-6 h-6" />
                        Security
                    </a>
                    <a className="flex items-center gap-4 px-6 py-4 text-muted-foreground hover:bg-[#1a191b] transition-colors duration-300" href="#">
                        <Users className="w-6 h-6" />
                        Team Access
                    </a>
                    <a className="flex items-center gap-4 px-6 py-4 text-muted-foreground hover:bg-[#1a191b] transition-colors duration-300" href="#">
                        <HelpCircle className="w-6 h-6" />
                        Support
                    </a>
                </nav>
            </aside>

            {/* Main Content Canvas */}
            <main className="flex-1 px-4 sm:px-6 lg:px-12 py-24 md:py-12 max-w-7xl mx-auto w-full z-10">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">Performance Pulse</h1>
                        <p className="font-sans text-muted-foreground max-w-2xl text-lg">Real-time engagement metrics and conversion tracking for your active GeoPulse campaigns.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
                    {/* Main Chart Card */}
                    <section className="lg:col-span-2 bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 lg:p-8 flex flex-col relative overflow-hidden border border-[rgba(72,72,73,0.15)] shadow-[0_10px_40px_-15px_rgba(143,245,255,0.08)]">
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <div className="flex items-center gap-4">
                                    <h2 className="font-display text-xl font-bold text-foreground">Real-time Reach</h2>
                                    {isLoading && <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>}
                                </div>
                                <p className="font-sans text-sm text-muted-foreground mt-1">Unique views across all active zones (Last 24h)</p>
                            </div>
                            <div className="flex items-center gap-2 bg-[#201f21]/80 px-3 py-1.5 rounded-full border border-[rgba(72,72,73,0.2)]">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#8ff5ff]"></span>
                                <span className="font-sans text-xs font-medium text-primary tracking-wider uppercase">Live</span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[240px] flex items-end relative z-10 w-full pt-8">
                            {/* Faux Neon Line Chart */}
                            <div className="absolute inset-0 flex items-end opacity-20 pointer-events-none">
                                <div className="w-full h-full bg-gradient-to-t from-primary/20 to-transparent blur-xl"></div>
                            </div>
                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                                {/* Grid lines */}
                                <line opacity="0.3" stroke="#484849" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="75" y2="75"></line>
                                <line opacity="0.3" stroke="#484849" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150"></line>
                                <line opacity="0.3" stroke="#484849" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="225" y2="225"></line>
                                
                                {/* Glow Layer */}
                                <path className="blur-md" d="M0,250 C100,220 200,280 300,180 C400,80 500,150 600,120 C700,90 800,40 900,100 L1000,60" fill="none" opacity="0.15" stroke="#8ff5ff" strokeWidth="16"></path>
                                <path className="blur-sm" d="M0,250 C100,220 200,280 300,180 C400,80 500,150 600,120 C700,90 800,40 900,100 L1000,60" fill="none" opacity="0.3" stroke="#00eefc" strokeWidth="8"></path>
                                
                                {/* Core Line */}
                                <path d="M0,250 C100,220 200,280 300,180 C400,80 500,150 600,120 C700,90 800,40 900,100 L1000,60" fill="none" stroke="#ffffff" strokeWidth="3"></path>
                                
                                {/* Data Points */}
                                <circle cx="300" cy="180" fill="#0e0e0f" r="6" stroke="#8ff5ff" strokeWidth="3"></circle>
                                <circle cx="600" cy="120" fill="#0e0e0f" r="6" stroke="#8ff5ff" strokeWidth="3"></circle>
                                <circle cx="900" cy="100" fill="#0e0e0f" r="6" stroke="#8ff5ff" strokeWidth="3"></circle>
                                
                                {/* Active Point */}
                                <circle className="animate-pulse shadow-[0_0_15px_#8ff5ff]" cx="1000" cy="60" fill="#8ff5ff" r="8"></circle>
                            </svg>
                        </div>
                    </section>

                    {/* Key Stats Column */}
                    <div className="flex flex-col gap-6 lg:gap-8">
                        {/* Stat Card 1 */}
                        <div className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 border border-[rgba(72,72,73,0.15)] flex-1 flex flex-col justify-between shadow-[0_10px_30px_-15px_rgba(214,116,255,0.05)]">
                            <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                <Eye className="w-5 h-5" />
                                <h3 className="font-display text-sm font-medium">Total Views</h3>
                            </div>
                            <div>
                                {isLoading ? (
                                    <div className="h-10 bg-[#2c2c2d] rounded animate-pulse w-24 mb-1"></div>
                                ) : (
                                    <div className="font-display text-4xl font-bold text-foreground mb-1">
                                        {metrics ? metrics.total_views.toLocaleString() : '0'}
                                    </div>
                                )}
                                <div className="font-sans text-sm text-primary flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Real-time tracking active</span>
                                </div>
                            </div>
                        </div>

                        {/* Stat Card 2 */}
                        <div className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 border border-[rgba(72,72,73,0.15)] flex-1 flex flex-col justify-between shadow-[0_10px_30px_-15px_rgba(187,0,253,0.05)] relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#bb00fd]/10 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="flex items-center gap-3 text-muted-foreground mb-4 relative z-10">
                                <Activity className="w-5 h-5" />
                                <h3 className="font-display text-sm font-medium">Shout Engagement</h3>
                            </div>
                            <div className="relative z-10">
                                {isLoading ? (
                                    <div className="h-10 bg-[#2c2c2d] rounded animate-pulse w-24 mb-1"></div>
                                ) : (
                                    <div className="font-display text-4xl font-bold text-foreground mb-1">
                                        {metrics ? `${metrics.engagement_rate}%` : '0%'}
                                    </div>
                                )}
                                <div className="font-sans text-sm text-[#d674ff] flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>{metrics ? metrics.total_engagements.toLocaleString() : '0'} total interactions</span>
                                </div>
                            </div>
                        </div>

                        {/* Stat Card 3 */}
                        <div className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 border border-[rgba(72,72,73,0.15)] flex-1 flex flex-col justify-between shadow-[0_10px_30px_-15px_rgba(255,110,132,0.05)]">
                            <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                <Footprints className="w-5 h-5" />
                                <h3 className="font-display text-sm font-medium">Store Navigations</h3>
                            </div>
                            <div>
                                {isLoading ? (
                                    <div className="h-10 bg-[#2c2c2d] rounded animate-pulse w-24 mb-1"></div>
                                ) : (
                                    <div className="font-display text-4xl font-bold text-foreground mb-1">
                                        {metrics ? metrics.total_navigations.toLocaleString() : '0'}
                                    </div>
                                )}
                                <div className="font-sans text-sm text-[#ff6e84] flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <span className="text-muted-foreground">Clicks to navigate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Shouts Section */}
                <section className="bg-[#131314] rounded-xl p-6 lg:p-8 relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-display text-xl font-bold text-foreground">Active Shouts</h2>
                        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                            View All <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Shout Item 1 */}
                        <div className="bg-[#1a191b]/30 rounded-md p-4 flex items-center gap-4 border border-[rgba(72,72,73,0.1)] hover:bg-[#1a191b]/50 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-md overflow-hidden shrink-0">
                                <img 
                                    alt="Promo Thumbnail" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDoAkudaoSR0sYu21rcnPpbUMso4ZAeXT24d5B79FJu3V11_epTXC_8HiKTiZjE63ZmrF8PyTZA2bhtEAbkcppErs61mvqTti9xUlvCCYKb525QUxlCotPpWYtYjRkuW_d1rrz7eRMKAnkAXBJ88hN9g46PCnQd6yER6qQHily5gHkZy9Jzs4EIXnodhqR2WtUKq4zwPvFeEN0zNaQ5CQfx-XiJKxn697r6UtTxDRcJZdI8-6_QnNjLoJSkJ8llP63nAVq1QbmzCg" 
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-display text-sm font-bold text-foreground truncate">Midnight Happy Hour Special</h4>
                                <p className="font-sans text-xs text-muted-foreground truncate">Downtown District • 2h remaining</p>
                            </div>
                            <div className="w-16 h-8 shrink-0 flex items-end justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                                    <path d="M0,25 L20,20 L40,28 L60,15 L80,22 L100,5" fill="none" stroke="#8ff5ff" strokeWidth="2"></path>
                                </svg>
                            </div>
                        </div>

                        {/* Shout Item 2 */}
                        <div className="bg-[#1a191b]/30 rounded-md p-4 flex items-center gap-4 border border-[rgba(72,72,73,0.1)] hover:bg-[#1a191b]/50 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-md overflow-hidden shrink-0">
                                <img 
                                    alt="Promo Thumbnail" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOiPifA6Qcsg62AT2MARggjcG33OrSgkbzt9ZsNVZiEqz5viZG-3tPv8yM5J9ngRb09J3GT6lXPan8P78hIMS_n32yKPvk5plQq2pZdXby6kbsT0Rh7p2g7GITxKjhb1Y3fPgx8gUaHPYiAGuQ88MnmF4KoolGhGZrY24afvgdN0m1BFnKfLPtX3yjpFobPNhcjjZK0bptxpZKMQdpeoHPJAeX4NAfAmp7r4_Z2trJBO8_QeSaxYFNnLo89UuXjiHt-Zz7R89HRf0" 
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-display text-sm font-bold text-foreground truncate">Guest DJ: Sonic Pulse</h4>
                                <p className="font-sans text-xs text-muted-foreground truncate">Warehouse Row • 4h remaining</p>
                            </div>
                            <div className="w-16 h-8 shrink-0 flex items-end justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                                    <path d="M0,20 L20,25 L40,15 L60,10 L80,18 L100,2" fill="none" stroke="#d674ff" strokeWidth="2"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
