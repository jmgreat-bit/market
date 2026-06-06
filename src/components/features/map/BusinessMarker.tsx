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
        const category = (business.category || '').toLowerCase();
        let color = '#6b7280'; // default gray
        if (category.includes('food') || category.includes('restaurant') || category.includes('cafe')) {
            color = '#22c55e';
        } else if (category.includes('retail')) {
            color = '#3b82f6';
        } else if (category.includes('event') || category.includes('entertainment')) {
            color = '#a855f7';
        }
        
        return L.divIcon({
            className: 'custom-business-marker',
            html: `
              <div style="position:relative;width:16px;height:16px;">
                <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.3;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
                <div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:2px solid rgba(0,0,0,0.3);box-shadow:0 0 6px ${color}80;"></div>
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            popupAnchor: [0, -8],
        });
    }, [business.category, business.is_premium]);

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
