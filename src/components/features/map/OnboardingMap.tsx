'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';

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

function GpsLocator({ onLocationSelect, setPosition }: { onLocationSelect: (lat: number, lng: number) => void, setPosition: (pos: [number, number]) => void }) {
    const map = useMap();
    const [isLocating, setIsLocating] = useState(false);

    const handleLocate = () => {
        setIsLocating(true);
        map.locate().on("locationfound", function (e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Check if retrieved location is inside Rwanda bounds
            const inRwanda = lat >= -2.9 && lat <= -1.0 && lng >= 28.8 && lng <= 30.9;
            
            if (inRwanda) {
                setPosition([lat, lng]);
                onLocationSelect(lat, lng);
                map.flyTo(e.latlng, map.getZoom());
            } else {
                alert("Your current location is outside Rwanda. Please manually pin your business location on the map of Rwanda.");
            }
            setIsLocating(false);
        }).on("locationerror", function (e) {
            alert("Could not access your location. Please check your permissions.");
            setIsLocating(false);
        });
    };

    return (
        <button 
            onClick={(e) => {
                e.preventDefault();
                handleLocate();
            }}
            className="absolute bottom-6 right-6 z-[400] w-12 h-12 bg-card rounded-full shadow-lg border border-border/50 flex items-center justify-center text-primary hover:bg-secondary transition-colors"
            title="Find My Location"
        >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
        </button>
    );
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
            minZoom={8}
            maxZoom={18}
            maxBounds={[[-2.9, 28.8], [-1.0, 30.9]]}
            maxBoundsViscosity={1.0}
            className="w-full h-full relative"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={position} icon={customIcon} />
            <MapClickHandler />
            <GpsLocator onLocationSelect={onLocationSelect} setPosition={setPosition} />
        </MapContainer>
    );
}
