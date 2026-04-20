'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BusinessDetails } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ExternalLink } from 'lucide-react';

interface BusinessMarkerProps {
    business: BusinessDetails;
    onClick?: (business: BusinessDetails) => void;
}

// Custom icon for business markers using external CSS
const createBusinessIcon = (isPremium: boolean) => {
    return L.divIcon({
        className: 'custom-business-marker',
        html: `
      <div class="business-marker-wrapper ${isPremium ? 'is-premium' : ''}">
        <div class="pulse-ring-1"></div>
        <div class="pulse-ring-2"></div>
        <div class="marker-core"></div>
      </div>
    `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
};

export function BusinessMarker({ business, onClick }: BusinessMarkerProps) {
    const icon = createBusinessIcon(business.is_premium);

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
