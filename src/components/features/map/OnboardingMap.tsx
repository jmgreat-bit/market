'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

// Fix for default marker icons in Leaflet + Next.js
const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface OnboardingMapProps {
    initialCenter: [number, number];
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function OnboardingMap({ initialCenter, onLocationSelect }: OnboardingMapProps) {
    const [position, setPosition] = useState<[number, number]>(initialCenter);

    function MapClickHandler() {
        useMapEvents({
            click(e) {
                setPosition([e.latlng.lat, e.latlng.lng]);
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    }

    return (
        <MapContainer 
            center={initialCenter} 
            zoom={15} 
            className="w-full h-full"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={position} icon={customIcon} />
            <MapClickHandler />
        </MapContainer>
    );
}
