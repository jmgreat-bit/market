import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
        return new NextResponse('Missing coordinates', { status: 400 });
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
        return new NextResponse('Mapbox token not configured', { status: 500 });
    }

    const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+8ff5ff(${lng},${lat})/${lng},${lat},14,0/400x160@2x?access_token=${mapboxToken}`;

    try {
        const response = await fetch(mapboxUrl);

        if (!response.ok) {
            return new NextResponse('Failed to fetch map image', { status: response.status });
        }

        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/png',
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
            },
        });
    } catch (error) {
        console.error('Mapbox proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
