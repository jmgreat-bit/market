'use client';

import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { CommercialHub } from '@/types';

interface HubMarkerProps {
    hub: CommercialHub;
    onClick: (hub: CommercialHub) => void;
}

export function HubMarker({ hub, onClick }: HubMarkerProps) {
    const icon = useMemo(() => {
        const iconHtml = `
            <div class="relative w-12 h-12 flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
                <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div class="absolute inset-2 bg-primary rounded-full shadow-[0_0_15px_rgba(143,245,255,0.6)] flex items-center justify-center border-2 border-background z-10 transition-transform group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-foreground"><path d="M4 10v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-11"/><path d="M2 10l10-7 10 7"/><path d="M10 22v-8h4v8"/></svg>
                </div>
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45 border-b-2 border-r-2 border-background z-0"></div>
            </div>
        `;

        return L.divIcon({
            html: iconHtml,
            className: 'custom-hub-marker',
            iconSize: [48, 48],
            iconAnchor: [24, 48], // Point is exactly at bottom center
        });
    }, []);

    return (
        <Marker
            position={[hub.latitude, hub.longitude]}
            icon={icon}
            eventHandlers={{
                click: () => onClick(hub),
            }}
        />
    );
}
