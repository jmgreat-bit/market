'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Dynamic import for Leaflet (it doesn't work with SSR)
const MapView = dynamic(
    () => import('@/components/features/map/MapView').then((mod) => mod.MapView),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
            </div>
        ),
    }
);

function MapPageInner() {
    const searchParams = useSearchParams();
    const targetLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const targetLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;

    return <MapView targetLat={targetLat} targetLng={targetLng} />;
}

export default function MapPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
            </div>
        }>
            <MapPageInner />
        </Suspense>
    );
}
