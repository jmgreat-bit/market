'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useBusinesses } from '@/hooks/useBusinesses';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';
import { UserLocationDot } from './UserLocationDot';
import { BusinessMarker } from './BusinessMarker';
import { MapSearchHUD } from './MapSearchHUD';
import { MapDetailPeek } from './MapDetailPeek';
import { useSettings } from '@/contexts/SettingsContext';
import { BusinessDetails, MapBounds } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, X, Navigation, Footprints } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Component to handle map center updates
function MapCenterUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    const [lat, lng] = center;

    useEffect(() => {
        map.flyTo([lat, lng], map.getZoom(), { duration: 1.5 });
    }, [lat, lng, map]);

    return null;
}

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick: () => void }) {
    useMapEvents({
        click: () => onClick(),
    });
    return null;
}

// Component to track map bounds and show search button
function MapBoundsTracker({ onBoundsChanged }: { onBoundsChanged: (bounds: MapBounds) => void }) {
    const map = useMapEvents({
        moveend: () => {
            const bounds = map.getBounds();
            onBoundsChanged({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
            });
        }
    });
    return null;
}

interface ActiveRoute {
    coordinates: [number, number][];
    distance: number;
    duration: number;
    profile: 'driving' | 'foot';
    businessName: string;
}

interface MapViewProps {
    targetLat?: number;
    targetLng?: number;
}

export function MapView({ targetLat, targetLng }: MapViewProps = {}) {
    const { theme } = useSettings();
    const { coordinates, isLoading: locationLoading } = useGeolocation();
    const hasTarget = targetLat !== undefined && targetLng !== undefined && !isNaN(targetLat) && !isNaN(targetLng);
    
    const [searchBounds, setSearchBounds] = useState<MapBounds | undefined>(undefined);
    const [currentBounds, setCurrentBounds] = useState<MapBounds | undefined>(undefined);
    const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);

    // Fetch businesses based on search bounds
    const { businesses, isLoading: businessesLoading } = useBusinesses({ bounds: searchBounds });
    
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([
        DEFAULT_MAP_CENTER.lat,
        DEFAULT_MAP_CENTER.lng,
    ]);
    const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetails | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
    const [isRouting, setIsRouting] = useState(false);

    // Filter businesses based on active category
    const filteredBusinesses = useMemo(() => {
        return categoryFilter
            ? businesses.filter(b => b.category === categoryFilter)
            : businesses;
    }, [businesses, categoryFilter]);

    // If target coordinates were passed (from "View on map" button), fly there
    useEffect(() => {
        if (hasTarget) {
            setMapCenter([targetLat!, targetLng!]);
        }
    }, [hasTarget, targetLat, targetLng]);

    // Update map center when user location is available initially (only if no target)
    useEffect(() => {
        if (coordinates && !searchBounds && !hasTarget) {
            const timer = setTimeout(() => {
                setMapCenter([coordinates.latitude, coordinates.longitude]);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [coordinates, searchBounds, hasTarget]);

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

    const fetchRoute = async (targetLat: number, targetLng: number, bizName: string, profile: 'driving' | 'foot' = 'foot') => {
        if (!coordinates) return;
        setIsRouting(true);
        setActiveRoute(null);
        setSelectedBusiness(null);
        try {
            const userLng = coordinates.longitude;
            const userLat = coordinates.latitude;
            const res = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${userLng},${userLat};${targetLng},${targetLat}?overview=full&geometries=geojson`);
            const data = await res.json();
            
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                // GeoJSON coordinates are [lng, lat], Leaflet needs [lat, lng]
                const latLngs = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                
                setActiveRoute({
                    coordinates: latLngs,
                    distance: route.distance, // in meters
                    duration: route.duration, // in seconds
                    profile,
                    businessName: bizName
                });
                
                // Fit bounds to show both points by setting map center roughly between them
                setMapCenter([(userLat + targetLat) / 2, (userLng + targetLng) / 2]);
            }
        } catch (error) {
            console.error("Failed to fetch route:", error);
        } finally {
            setIsRouting(false);
        }
    };

    const handleBoundsChanged = (bounds: MapBounds) => {
        setCurrentBounds(bounds);
        if (searchBounds) {
            // Check if map moved significantly to show the button
            const latDiff = Math.abs(bounds.north - searchBounds.north);
            const lngDiff = Math.abs(bounds.east - searchBounds.east);
            if (latDiff > 0.005 || lngDiff > 0.005) {
                setShowSearchAreaButton(true);
            }
        } else {
            // First time moving map, allow searching that area
            setShowSearchAreaButton(true);
        }
    };

    const handleSearchArea = () => {
        if (currentBounds) {
            setSearchBounds(currentBounds);
            setShowSearchAreaButton(false);
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
            {/* Loading overlay for initial location */}
            {locationLoading && !coordinates && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full geo-gradient animate-pulse" />
                        <p className="text-sm text-muted-foreground font-medium tracking-wide">Locating you...</p>
                    </div>
                </div>
            )}

            {/* Search this area button */}
            <AnimatePresence>
                {showSearchAreaButton && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="absolute top-28 left-1/2 -translate-x-1/2 z-30"
                    >
                        <button 
                            onClick={handleSearchArea}
                            disabled={businessesLoading}
                            className="bg-primary/90 backdrop-blur-md text-primary-foreground font-bold px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(143,245,255,0.3)] text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100 border border-primary/50"
                        >
                            {businessesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search this area
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <MapContainer
                center={mapCenter}
                zoom={DEFAULT_MAP_ZOOM}
                minZoom={8}
                maxZoom={18}
                maxBounds={[[-2.9, 28.8], [-1.0, 30.9]]}
                maxBoundsViscosity={1.0}
                className="w-full h-full z-10"
                zoomControl={false}
            >
                <MapClickHandler onClick={handleMapClick} />
                <MapBoundsTracker onBoundsChanged={handleBoundsChanged} />
                
                {/* Dynamic tile layer based on theme */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={tileUrl}
                />

                {/* User location */}
                {coordinates && (
                    <>
                        {/* Only auto-update center if we haven't manually searched an area */}
                        {!searchBounds && <MapCenterUpdater center={[coordinates.latitude, coordinates.longitude]} />}
                        <UserLocationDot
                            position={[coordinates.latitude, coordinates.longitude]}
                        />
                    </>
                )}

                {/* Business markers */}
                {filteredBusinesses.map((business) => (
                    <BusinessMarker
                        key={business.id}
                        business={business}
                        onClick={handleBusinessSelect}
                    />
                ))}

                {/* Route Polyline */}
                {activeRoute && (
                    <Polyline 
                        positions={activeRoute.coordinates} 
                        color={theme === 'light' ? '#0070f3' : '#3291ff'} 
                        weight={5} 
                        opacity={0.8}
                        dashArray="10, 10"
                        lineCap="round"
                    />
                )}
            </MapContainer>

            {/* Floating zoom controls */}
            <div className="absolute right-4 bottom-20 md:bottom-4 z-20 flex flex-col gap-2">
                <button className="w-10 h-10 rounded-xl bg-card/90 backdrop-blur-md shadow-lg border border-border/50 flex items-center justify-center text-foreground hover:bg-secondary hover:text-primary transition-colors font-medium text-lg">
                    +
                </button>
                <button className="w-10 h-10 rounded-xl bg-card/90 backdrop-blur-md shadow-lg border border-border/50 flex items-center justify-center text-foreground hover:bg-secondary hover:text-primary transition-colors font-medium text-lg">
                    −
                </button>
            </div>

            {/* Glassmorphic Search HUD */}
            <MapSearchHUD onCategoryFilter={setCategoryFilter} />

            {/* Route Navigation HUD */}
            <AnimatePresence>
                {activeRoute && (
                    <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-30"
                    >
                        <div className="bg-background/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-display font-bold text-lg">Route to {activeRoute.businessName}</h3>
                                <button 
                                    onClick={() => setActiveRoute(null)}
                                    className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 bg-secondary/50 p-1 rounded-xl">
                                    <button 
                                        onClick={() => fetchRoute(activeRoute.coordinates[activeRoute.coordinates.length - 1][0], activeRoute.coordinates[activeRoute.coordinates.length - 1][1], activeRoute.businessName, 'foot')}
                                        disabled={isRouting}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors ${activeRoute.profile === 'foot' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {isRouting && activeRoute.profile !== 'foot' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Footprints className="w-4 h-4" />} Walking
                                    </button>
                                    <button 
                                        onClick={() => fetchRoute(activeRoute.coordinates[activeRoute.coordinates.length - 1][0], activeRoute.coordinates[activeRoute.coordinates.length - 1][1], activeRoute.businessName, 'driving')}
                                        disabled={isRouting}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors ${activeRoute.profile === 'driving' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {isRouting && activeRoute.profile !== 'driving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />} Driving
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary">
                                        {activeRoute.distance > 1000 ? (activeRoute.distance / 1000).toFixed(1) + ' km' : Math.round(activeRoute.distance) + ' m'}
                                    </p>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {Math.round(activeRoute.duration / 60)} min
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Peek Sheet */}
            <AnimatePresence>
                {selectedBusiness && (
                    <MapDetailPeek 
                        business={selectedBusiness} 
                        onClose={() => setSelectedBusiness(null)} 
                        onShowRoute={coordinates ? () => fetchRoute(selectedBusiness.latitude, selectedBusiness.longitude, selectedBusiness.business_name, 'foot') : undefined}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
