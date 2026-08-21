import { render, screen, fireEvent } from '@testing-library/react';
import { HubMarker } from './HubMarker';
import { CommercialHub } from '@/types';
import L from 'leaflet';

// Mock react-leaflet
jest.mock('react-leaflet', () => ({
    Marker: ({ position, icon, eventHandlers }: any) => {
        return (
            <div
                data-testid="mock-marker"
                data-position={JSON.stringify(position)}
                data-icon={JSON.stringify(icon)}
                onClick={eventHandlers?.click}
            />
        );
    }
}));

// Mock leaflet
jest.mock('leaflet', () => ({
    divIcon: jest.fn().mockImplementation((options) => options)
}));

const mockHub: CommercialHub = {
    id: 'hub-1',
    name: 'Test Hub',
    description: 'A test commercial hub',
    latitude: 5.55,
    longitude: -0.2,
    address: 'Test Address',
    image_url: null,
    created_at: new Date().toISOString(),
};

describe('HubMarker', () => {
    const mockOnClick = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders a Marker with correct position and icon', () => {
        render(<HubMarker hub={mockHub} onClick={mockOnClick} />);

        const marker = screen.getByTestId('mock-marker');
        expect(marker).toBeInTheDocument();

        // Check position
        expect(marker).toHaveAttribute('data-position', JSON.stringify([5.55, -0.2]));

        // Check that leaflet.divIcon was called with the right parameters
        expect(L.divIcon).toHaveBeenCalledTimes(1);
        const divIconOptions = (L.divIcon as jest.Mock).mock.calls[0][0];

        expect(divIconOptions.className).toBe('custom-hub-marker');
        expect(divIconOptions.iconSize).toEqual([48, 48]);
        expect(divIconOptions.iconAnchor).toEqual([24, 48]);
        expect(divIconOptions.html).toContain('svg');
    });

    it('calls onClick with the hub when clicked', () => {
        render(<HubMarker hub={mockHub} onClick={mockOnClick} />);

        const marker = screen.getByTestId('mock-marker');
        fireEvent.click(marker);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
        expect(mockOnClick).toHaveBeenCalledWith(mockHub);
    });
});
