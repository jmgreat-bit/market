'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trash2 } from 'lucide-react';

// Define a custom icon since default marker icons can be buggy in Next.js
const dotIcon = L.divIcon({
    className: 'bg-blue-500 rounded-full border-2 border-white shadow-md',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

interface PolygonDrawMapProps {
    points: { lat: number; lng: number }[];
    onChange: (points: { lat: number; lng: number }[]) => void;
    center?: [number, number]; // default center
}

function MapEvents({ onChange, points }: { onChange: (p: any) => void, points: any[] }) {
    useMapEvents({
        click(e) {
            onChange([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
        },
    });
    return null;
}

export default function PolygonDrawMap({ points, onChange, center = [-1.9441, 30.0619] }: PolygonDrawMapProps) {
    // Prevent SSR issues
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="w-full h-[300px] bg-slate-800 rounded-lg animate-pulse" />;
    }

    return (
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-slate-700">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">Carto</a>'
                />
                
                <MapEvents onChange={onChange} points={points} />

                {/* Render markers for all points */}
                {points.map((p, i) => (
                    <Marker key={i} position={[p.lat, p.lng]} icon={dotIcon} />
                ))}

                {/* Render Polygon if we have at least 3 points */}
                {points.length >= 3 && (
                    <Polygon 
                        positions={points.map(p => [p.lat, p.lng])} 
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                    />
                )}
            </MapContainer>

            {/* Controls */}
            {points.length > 0 && (
                <div className="absolute top-2 right-2 z-[400]">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onChange([]);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg flex items-center justify-center transition-colors"
                        title="Clear Shape"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
            
            {/* Helper text */}
            <div className="absolute bottom-2 left-2 z-[400] bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-md pointer-events-none">
                {points.length === 0 ? "Click map to start drawing" : 
                 points.length < 3 ? `Click ${3 - points.length} more point${points.length === 2 ? '' : 's'}` : 
                 "Shape closed. Click to add more points."}
            </div>
        </div>
    );
}
