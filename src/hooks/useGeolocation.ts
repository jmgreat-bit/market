'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coordinates } from '@/types';

interface GeolocationState {
    coordinates: Coordinates | null;
    error: string | null;
    isLoading: boolean;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        coordinates: null,
        error: null,
        isLoading: true,
    });

    const handlePosition = useCallback((position: GeolocationPosition) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Check if the retrieved location is inside Rwanda bounds
        const inRwanda = lat >= -2.9 && lat <= -1.0 && lng >= 28.8 && lng <= 30.9;

        if (inRwanda) {
            setState({
                coordinates: {
                    latitude: lat,
                    longitude: lng,
                },
                error: null,
                isLoading: false,
            });
        } else {
            // Silently fall back to Kigali (coordinates null triggers default Kigali center in consuming components)
            setState({
                coordinates: null,
                error: null,
                isLoading: false,
            });
        }
    }, []);

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setState({
                coordinates: null,
                error: 'Geolocation is not supported by your browser',
                isLoading: false,
            });
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Step 1: Try high accuracy (GPS satellites)
        navigator.geolocation.getCurrentPosition(
            handlePosition,
            () => {
                // Step 2: GPS failed — fall back to low accuracy (Wi-Fi / cell towers)
                navigator.geolocation.getCurrentPosition(
                    handlePosition,
                    (error) => {
                        let errorMessage = 'Unable to retrieve your location';
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Location permission denied. Please enable location access.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = 'Location information is unavailable.';
                                break;
                            case error.TIMEOUT:
                                errorMessage = 'Location request timed out. Please try again.';
                                break;
                        }
                        setState({
                            coordinates: null,
                            error: errorMessage,
                            isLoading: false,
                        });
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 600000, // Accept cached locations up to 10 minutes old
                    }
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000, // Accept cached locations up to 5 minutes old
            }
        );
    }, [handlePosition]);

    useEffect(() => {
        const timer = setTimeout(() => {
            requestLocation();
        }, 0);
        return () => clearTimeout(timer);
    }, [requestLocation]);

    return {
        ...state,
        requestLocation,
    };
}
