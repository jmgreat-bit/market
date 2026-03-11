'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BusinessDetails } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ExternalLink } from 'lucide-react';

interface BusinessMarkerProps {
    business: BusinessDetails;
}

// Custom icon for business markers
const createBusinessIcon = (isPremium: boolean) => {
    const color = isPremium ? '#00d4ff' : '#635bff';

    return L.divIcon({
        className: 'custom-business-marker',
        html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
        ">📍</div>
      </div>
    `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
};

export function BusinessMarker({ business }: BusinessMarkerProps) {
    const icon = createBusinessIcon(business.is_premium);

    return (
        <Marker
            position={[business.latitude, business.longitude]}
            icon={icon}
        >
            <Popup className="custom-popup">
                <div className="min-w-[200px] p-1">
                    {/* Business header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <h3 className="font-semibold text-foreground text-sm">
                                {business.business_name}
                            </h3>
                            {business.category && (
                                <Badge variant="secondary" className="mt-1 text-[10px]">
                                    {business.category}
                                </Badge>
                            )}
                        </div>
                        {business.is_premium && (
                            <Star className="w-4 h-4 text-accent fill-accent" />
                        )}
                    </div>

                    {/* Bio */}
                    {business.bio && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {business.bio}
                        </p>
                    )}

                    {/* Address */}
                    {business.address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{business.address}</span>
                        </div>
                    )}

                    {/* Action button */}
                    <Button size="sm" className="w-full geo-gradient text-white">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Details
                    </Button>
                </div>
            </Popup>
        </Marker>
    );
}
