'use client';

import { CircleMarker } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

interface UserLocationDotProps {
    position: LatLngExpression;
}

export function UserLocationDot({ position }: UserLocationDotProps) {
    return (
        <>
            {/* Pulsing ring effect */}
            <CircleMarker
                center={position}
                radius={20}
                pathOptions={{
                    color: '#635bff',
                    fillColor: '#635bff',
                    fillOpacity: 0.2,
                    weight: 0,
                    className: 'pulse-dot',
                }}
            />

            {/* Inner solid dot */}
            <CircleMarker
                center={position}
                radius={8}
                pathOptions={{
                    color: '#ffffff',
                    fillColor: '#635bff',
                    fillOpacity: 1,
                    weight: 3,
                }}
            />
        </>
    );
}
