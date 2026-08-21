import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import OnboardingMap from './OnboardingMap';
import '@testing-library/jest-dom';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
    LocateFixed: () => <div data-testid="locate-fixed-icon">LocateFixed</div>,
    Loader2: () => <div data-testid="loader2-icon">Loader2</div>,
}));

// Mock React Leaflet components and hooks
jest.mock('react-leaflet', () => {
    let _mapEventsClickCallback: ((e: { latlng: { lat: number, lng: number } }) => void) | null = null;
    let _mockMapInstance: any = null;

    const useMapEvents = (handlers: { click?: (e: { latlng: { lat: number, lng: number } }) => void }) => {
        if (handlers.click) {
            _mapEventsClickCallback = handlers.click;
        }
        return _mockMapInstance;
    };

    const useMap = () => _mockMapInstance;

    return {
        MapContainer: ({ children, center, ...props }: any) => {
            return (
                <div data-testid="map-container" data-center={JSON.stringify(center)} {...props}>
                    {children}
                </div>
            );
        },
        TileLayer: () => <div data-testid="tile-layer" />,
        Marker: ({ position }: any) => <div data-testid="marker" data-position={JSON.stringify(position)} />,
        useMapEvents,
        useMap,
        __setMockMapInstance: (instance: any) => { _mockMapInstance = instance; },
        __simulateMapClick: (lat: number, lng: number) => {
            if (_mapEventsClickCallback) {
                _mapEventsClickCallback({ latlng: { lat, lng } });
            }
        }
    };
});

describe('OnboardingMap', () => {
    const mockOnLocationSelect = jest.fn();
    const defaultCenter: [number, number] = [-1.9441, 30.0619]; // Kigali, Rwanda

    let mockFlyTo: jest.Mock;
    let mockGetZoom: jest.Mock;
    let mockOnLocationFound: any;
    let mockOnLocationError: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockFlyTo = jest.fn();
        mockGetZoom = jest.fn().mockReturnValue(15);

        // Setup mock locate mechanism
        const locateObj = {
            on: jest.fn().mockImplementation(function(this: any, event: string, callback: any) {
                if (event === 'locationfound') {
                    mockOnLocationFound = callback;
                } else if (event === 'locationerror') {
                    mockOnLocationError = callback;
                }
                return this; // return self for chaining
            })
        };

        const mockMapInstance = {
            locate: jest.fn().mockReturnValue(locateObj),
            flyTo: mockFlyTo,
            getZoom: mockGetZoom
        };

        const { __setMockMapInstance } = require('react-leaflet');
        __setMockMapInstance(mockMapInstance);
    });

    it('renders the map container, tile layer, and initial marker', () => {
        render(
            <OnboardingMap initialCenter={defaultCenter} onLocationSelect={mockOnLocationSelect} />
        );

        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.getByTestId('tile-layer')).toBeInTheDocument();

        const marker = screen.getByTestId('marker');
        expect(marker).toBeInTheDocument();
        expect(marker).toHaveAttribute('data-position', JSON.stringify(defaultCenter));
    });

    it('updates marker position and calls onLocationSelect when map is clicked', () => {
        render(
            <OnboardingMap initialCenter={defaultCenter} onLocationSelect={mockOnLocationSelect} />
        );

        const { __simulateMapClick } = require('react-leaflet');

        // Simulate click at new coordinates
        const newLat = -2.0;
        const newLng = 30.1;

        act(() => {
            __simulateMapClick(newLat, newLng);
        });

        // Check if onLocationSelect was called
        expect(mockOnLocationSelect).toHaveBeenCalledWith(newLat, newLng);

        // Check if marker position updated
        const marker = screen.getByTestId('marker');
        expect(marker).toHaveAttribute('data-position', JSON.stringify([newLat, newLng]));
    });

    describe('GpsLocator', () => {
        it('handles successful geolocation inside Rwanda', () => {
            render(
                <OnboardingMap initialCenter={defaultCenter} onLocationSelect={mockOnLocationSelect} />
            );

            const locateButton = screen.getByTitle('Find My Location');
            expect(locateButton).toBeInTheDocument();

            // Click locate button
            fireEvent.click(locateButton);

            // Wait for loader state, though it might be brief
            expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();

            const { useMap } = require('react-leaflet');
            const map = useMap();
            expect(map.locate).toHaveBeenCalled();

            // Simulate finding location inside Rwanda bounds
            const rwandaLat = -1.9;
            const rwandaLng = 30.0;

            act(() => {
                mockOnLocationFound({
                    latlng: { lat: rwandaLat, lng: rwandaLng }
                });
            });

            // Verify the results
            expect(mockOnLocationSelect).toHaveBeenCalledWith(rwandaLat, rwandaLng);
            expect(mockFlyTo).toHaveBeenCalledWith({ lat: rwandaLat, lng: rwandaLng }, 15);

            // Marker should be updated
            const marker = screen.getByTestId('marker');
            expect(marker).toHaveAttribute('data-position', JSON.stringify([rwandaLat, rwandaLng]));

            // Icon should reset to LocateFixed
            expect(screen.getByTestId('locate-fixed-icon')).toBeInTheDocument();
        });

        it('handles successful geolocation outside Rwanda', () => {
            render(
                <OnboardingMap initialCenter={defaultCenter} onLocationSelect={mockOnLocationSelect} />
            );

            const locateButton = screen.getByTitle('Find My Location');

            // Click locate button
            fireEvent.click(locateButton);

            // Simulate finding location outside Rwanda bounds (e.g., Paris)
            const outsideLat = 48.8566;
            const outsideLng = 2.3522;

            act(() => {
                mockOnLocationFound({
                    latlng: { lat: outsideLat, lng: outsideLng }
                });
            });

            // onLocationSelect should NOT be called
            expect(mockOnLocationSelect).not.toHaveBeenCalled();

            // map.flyTo should NOT be called
            expect(mockFlyTo).not.toHaveBeenCalled();

            // Error message should be displayed
            expect(screen.getByText('Your current location is outside Rwanda. Please manually pin your business location on the map.')).toBeInTheDocument();

            // Icon should reset to LocateFixed
            expect(screen.getByTestId('locate-fixed-icon')).toBeInTheDocument();
        });

        it('handles geolocation error', () => {
            render(
                <OnboardingMap initialCenter={defaultCenter} onLocationSelect={mockOnLocationSelect} />
            );

            const locateButton = screen.getByTitle('Find My Location');

            // Click locate button
            fireEvent.click(locateButton);

            // Simulate geolocation error
            act(() => {
                mockOnLocationError({
                    message: 'User denied Geolocation'
                });
            });

            // Error message should be displayed
            expect(screen.getByText('Could not access your location. Please check your permissions.')).toBeInTheDocument();

            // Icon should reset to LocateFixed
            expect(screen.getByTestId('locate-fixed-icon')).toBeInTheDocument();
        });

        it('allows closing the error message', () => {
            render(
                <OnboardingMap initialCenter={defaultCenter} onLocationSelect={mockOnLocationSelect} />
            );

            const locateButton = screen.getByTitle('Find My Location');

            // Click locate button and trigger error
            fireEvent.click(locateButton);
            act(() => {
                mockOnLocationError({});
            });

            // Error message is shown
            const errorMessage = screen.getByText('Could not access your location. Please check your permissions.');
            expect(errorMessage).toBeInTheDocument();

            // Find and click close button (✕)
            const closeButton = screen.getByText('✕');
            fireEvent.click(closeButton);

            // Error message should be gone
            expect(errorMessage).not.toBeInTheDocument();
        });
    });
});
