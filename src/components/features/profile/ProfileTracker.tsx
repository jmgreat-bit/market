'use client';

import { useEffect } from 'react';

interface ProfileTrackerProps {
    businessId: string;
    viewerId?: string;
}

export default function ProfileTracker({ businessId, viewerId }: ProfileTrackerProps) {
    useEffect(() => {
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId, type: 'view', viewerId }),
        }).catch(() => {
            // Silently ignore tracking failures
        });
    }, [businessId, viewerId]);

    return null;
}
