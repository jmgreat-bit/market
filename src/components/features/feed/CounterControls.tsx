'use client';

import { useState, useCallback } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { COUNTER_UPDATE_COOLDOWN_MS } from '@/lib/constants';

interface CounterControlsProps {
    postId: string;
    currentValue: number;
    label: string;
    onUpdate: (newValue: number) => void;
}

export function CounterControls({ postId, currentValue, label, onUpdate }: CounterControlsProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(0);

    const updateCounter = useCallback(async (delta: number) => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime;

        if (timeSinceLastUpdate < COUNTER_UPDATE_COOLDOWN_MS && lastUpdateTime > 0) {
            const remainingMin = Math.ceil((COUNTER_UPDATE_COOLDOWN_MS - timeSinceLastUpdate) / 60000);
            alert(`Please wait ${remainingMin} minute${remainingMin > 1 ? 's' : ''} before updating again.`);
            return;
        }

        const newValue = Math.max(0, currentValue + delta);
        if (newValue === currentValue) return;

        setIsUpdating(true);
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('posts')
                .update({ counter_value: newValue })
                .eq('id', postId);
            
            if (error) throw error;
            onUpdate(newValue);
            setLastUpdateTime(Date.now());
        } catch (err) {
            console.error('Counter update failed:', err);
            alert('Failed to update counter. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }, [postId, currentValue, lastUpdateTime, onUpdate]);

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => updateCounter(-1)}
                disabled={isUpdating || currentValue <= 0}
                className="w-9 h-9 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-foreground hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
            </button>
            <button
                onClick={() => updateCounter(1)}
                disabled={isUpdating}
                className="w-9 h-9 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
        </div>
    );
}
