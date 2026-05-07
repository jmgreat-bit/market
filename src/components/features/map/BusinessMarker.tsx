'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';
import { BusinessDetails } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ExternalLink } from 'lucide-react';

interface BusinessMarkerProps {
    business: BusinessDetails;
    onClick?: (business: BusinessDetails) => void;
}

export function BusinessMarker({ business, onClick }: BusinessMarkerProps) {
    const icon = useMemo(() => {
        return L.divIcon({
            className: 'custom-business-marker',
            html: `
              <div class="business-marker-wrapper ${business.is_premium ? 'is-premium' : ''}">
                <div class="pulse-ring-1"></div>
                <div class="pulse-ring-2"></div>
                <div class="marker-core"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12],
        });
    }, [business.is_premium]);

    return (
        <Marker
            position={[business.latitude, business.longitude]}
            icon={icon}
            eventHandlers={{
                click: () => onClick?.(business),
            }}
        />
    );
}
