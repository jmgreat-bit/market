'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';
import { X, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export function ProfileCompletionBanner() {
    const { profile, isAuthenticated } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [missingItems, setMissingItems] = useState<string[]>([]);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (isDismissed || !isAuthenticated || profile?.role !== 'trader') return;

        // Skip if dismissed in this session
        if (sessionStorage.getItem('hideProfileBanner') === 'true') {
            return;
        }

        const checkProfile = async () => {
            const missing = [];
            if (!profile.avatar_url) {
                missing.push('Business Logo');
            }

            const supabase = getSupabaseClient();
            const { data: business } = await supabase
                .from('business_details')
                .select('business_name, category, bio')
                .eq('profile_id', profile.id)
                .maybeSingle();

            if (!business) {
                missing.push('Business Details');
            } else {
                if (!business.business_name) missing.push('Name');
                if (!business.category) missing.push('Category');
                if (!business.bio) missing.push('Description');
            }

            if (missing.length > 0) {
                setMissingItems(missing);
                setIsVisible(true);
            }
        };
        
        checkProfile();
    }, [profile, isAuthenticated, isDismissed]);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem('hideProfileBanner', 'true');
    };

    if (!isVisible || missingItems.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/20 px-4 py-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <AlertCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-sm text-foreground">Complete your Business Profile</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Missing: <span className="font-medium text-foreground/80">{missingItems.join(', ')}</span>. Profiles with complete data attract more customers!
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <Link href="/profile" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap shadow-geo-glow flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors">
                            Complete Now <ArrowRight className="w-3 h-3" />
                        </button>
                    </Link>
                    <button 
                        onClick={handleDismiss} 
                        className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors shrink-0" 
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
