'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useBusinesses } from '@/hooks/useBusinesses';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';
import { UserLocationDot } from './UserLocationDot';
import { BusinessMarker } from './BusinessMarker';
import { MapSearchHUD } from './MapSearchHUD';
import { MapDetailPeek } from './MapDetailPeek';
import { useSettings } from '@/contexts/SettingsContext';
import { BusinessDetails } from '@/types';
import { AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Component to handle map center updates
function MapCenterUpdater({ center }: { center: LatLngExpression }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo(center, map.getZoom(), { duration: 1.5 });
    }, [center, map]);

    return null;
}

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick: () => void }) {
    useMapEvents({
        click: () => onClick(),
    });
    return null;
}

export function MapView() {
    const { theme } = useSettings();
    const { coordinates, isLoading: locationLoading } = useGeolocation();
    const { businesses } = useBusinesses();
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([
        DEFAULT_MAP_CENTER.lat,
        DEFAULT_MAP_CENTER.lng,
    ]);
    const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetails | null>(null);

    // Update map center when user location is available
    useEffect(() => {
        if (coordinates) {
            setMapCenter([coordinates.latitude, coordinates.longitude]);
        }
    }, [coordinates]);

    const tileUrl = theme === 'light' 
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    const handleBusinessSelect = (business: BusinessDetails) => {
        setMapCenter([business.latitude, business.longitude]);
        setSelectedBusiness(business);
    };

    const handleMapClick = () => {
        setSelectedBusiness(null);
    };

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
            {/* Loading overlay */}
            {locationLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full geo-gradient animate-pulse" />
                        <p className="text-sm text-muted-foreground">Finding your location...</p>
                    </div>
                </div>
            )}

            <MapContainer
                center={mapCenter}
                zoom={DEFAULT_MAP_ZOOM}
                className="w-full h-full z-10"
                zoomControl={false}
            >
                <MapClickHandler onClick={handleMapClick} />
                {/* Dynamic tile layer based on theme */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url={tileUrl}
                />

                {/* User location */}
                {coordinates && (
                    <>
                        <MapCenterUpdater center={[coordinates.latitude, coordinates.longitude]} />
                        <UserLocationDot
                            position={[coordinates.latitude, coordinates.longitude]}
                        />
                    </>
                )}

                {/* Business markers */}
                {businesses.map((business) => (
                    <BusinessMarker
                        key={business.id}
                        business={business}
                        onClick={handleBusinessSelect}
                    />
                ))}
            </MapContainer>

            {/* Floating zoom controls */}
            <div className="absolute right-4 bottom-20 md:bottom-4 z-20 flex flex-col gap-2">
                <button className="w-10 h-10 rounded-lg glass-card flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
                    +
                </button>
                <button className="w-10 h-10 rounded-lg glass-card flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
                    −
                </button>
            </div>

            {/* Glassmorphic Search HUD */}
            <MapSearchHUD />

            {/* Detail Peek Sheet */}
            <AnimatePresence>
                {selectedBusiness && (
                    <MapDetailPeek 
                        business={selectedBusiness} 
                        onClose={() => setSelectedBusiness(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
