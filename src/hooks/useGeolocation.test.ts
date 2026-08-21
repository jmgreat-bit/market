import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

// Mock the geolocation API
const mockGetCurrentPosition = jest.fn();

const mockGeolocation = {
    getCurrentPosition: mockGetCurrentPosition,
};

// Store original to restore later
const originalGeolocation = global.navigator.geolocation;

describe('useGeolocation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        Object.defineProperty(global.navigator, 'geolocation', {
            value: mockGeolocation,
            writable: true,
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        Object.defineProperty(global.navigator, 'geolocation', {
            value: originalGeolocation,
            writable: true,
        });
    });

    it('should start with initial loading state', () => {
        const { result } = renderHook(() => useGeolocation());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.coordinates).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('should handle unsupported browser geolocation', () => {
        Object.defineProperty(global.navigator, 'geolocation', {
            value: undefined,
            writable: true,
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.coordinates).toBeNull();
        expect(result.current.error).toBe('Geolocation is not supported by your browser');
    });

    it('should retrieve location successfully within Rwanda bounds', () => {
        // Setup mock to call success callback with coordinates inside Rwanda
        // Bounds: lat >= -2.9 && lat <= -1.0 && lng >= 28.8 && lng <= 30.9
        const kigaliPosition = {
            coords: {
                latitude: -1.95,
                longitude: 30.06,
            }
        };

        mockGetCurrentPosition.mockImplementationOnce((successCb) => {
            successCb(kigaliPosition);
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        expect(mockGetCurrentPosition).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.coordinates).toEqual({
            latitude: -1.95,
            longitude: 30.06,
        });
    });

    it('should fall back to null if location is outside Rwanda bounds', () => {
        // Setup mock to call success callback with coordinates outside Rwanda
        const newYorkPosition = {
            coords: {
                latitude: 40.71,
                longitude: -74.00,
            }
        };

        mockGetCurrentPosition.mockImplementationOnce((successCb) => {
            successCb(newYorkPosition);
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        expect(mockGetCurrentPosition).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.coordinates).toBeNull();
    });

    it('should handle PERMISSION_DENIED error', () => {
        mockGetCurrentPosition.mockImplementationOnce((successCb, errorCb) => {
            errorCb({ code: 1, PERMISSION_DENIED: 1 });
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.coordinates).toBeNull();
        expect(result.current.error).toBe("Location access is blocked. Please turn on your device's GPS, or check your app permissions in settings, then click Retry.");
    });

    it('should handle POSITION_UNAVAILABLE error', () => {
        mockGetCurrentPosition.mockImplementationOnce((successCb, errorCb) => {
            errorCb({ code: 2, POSITION_UNAVAILABLE: 2 });
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.coordinates).toBeNull();
        expect(result.current.error).toBe("Your phone's GPS is currently turned off or unavailable. Turn it on to see nearby traders!");
    });

    it('should handle TIMEOUT error', () => {
        mockGetCurrentPosition.mockImplementationOnce((successCb, errorCb) => {
            errorCb({ code: 3, TIMEOUT: 3 });
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.coordinates).toBeNull();
        expect(result.current.error).toBe("Location request timed out. Please ensure your phone's GPS is turned on and try again.");
    });

    it('should handle unknown error without message', () => {
        mockGetCurrentPosition.mockImplementationOnce((successCb, errorCb) => {
            errorCb({ code: 999 }); // some unknown code
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.coordinates).toBeNull();
        expect(result.current.error).toBe("Unable to retrieve your location");
    });

    it('should handle unknown error and fall back to error.message', () => {
        mockGetCurrentPosition.mockImplementationOnce((successCb, errorCb) => {
            errorCb({ code: 999, message: "Custom API error message" });
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.coordinates).toBeNull();
        expect(result.current.error).toBe("Custom API error message");
    });

    it('should allow manual requestLocation call', () => {
        mockGetCurrentPosition.mockImplementationOnce((successCb, errorCb) => {
            errorCb({ code: 1, PERMISSION_DENIED: 1 });
        });

        const { result } = renderHook(() => useGeolocation());

        act(() => {
            jest.runAllTimers();
        });

        // First call fails
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);

        // Setup mock for manual call
        const kigaliPosition = {
            coords: {
                latitude: -1.95,
                longitude: 30.06,
            }
        };
        mockGetCurrentPosition.mockImplementationOnce((successCb) => {
            successCb(kigaliPosition);
        });

        act(() => {
            result.current.requestLocation();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.coordinates).toEqual({
            latitude: -1.95,
            longitude: 30.06,
        });
    });
});
