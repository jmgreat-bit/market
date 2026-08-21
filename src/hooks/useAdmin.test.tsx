import { renderHook } from '@testing-library/react';
import { useAdmin } from './useAdmin';
import { useUser } from './useUser';

// Mock useUser hook
jest.mock('./useUser', () => ({
    useUser: jest.fn()
}));

const mockUseUser = useUser as jest.Mock;

describe('useAdmin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return null role when user is not authenticated', () => {
        mockUseUser.mockReturnValue({
            user: null,
            profile: null,
            isLoading: false
        });

        const { result } = renderHook(() => useAdmin());

        expect(result.current.role).toBeNull();
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isMaster).toBe(false);
        expect(result.current.isStaff).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should return null role when user has no email', () => {
        mockUseUser.mockReturnValue({
            user: { id: 'user-id' }, // No email
            profile: { id: 'user-id', role: 'client' },
            isLoading: false
        });

        const { result } = renderHook(() => useAdmin());

        expect(result.current.role).toBeNull();
        expect(result.current.isAdmin).toBe(false);
    });

    it('should return master role for the master admin email', () => {
        mockUseUser.mockReturnValue({
            user: { id: 'master-id', email: 'thegreat@admin.sir' },
            profile: { id: 'master-id', role: 'client' },
            isLoading: false
        });

        const { result } = renderHook(() => useAdmin());

        expect(result.current.role).toBe('master');
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isMaster).toBe(true);
        expect(result.current.isStaff).toBe(false);
    });

    it('should return staff role for staff emails', () => {
        mockUseUser.mockReturnValue({
            user: { id: 'staff-id', email: 'bob@staff.marketplc.com' },
            profile: { id: 'staff-id', role: 'client' },
            isLoading: false
        });

        const { result } = renderHook(() => useAdmin());

        expect(result.current.role).toBe('staff');
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isMaster).toBe(false);
        expect(result.current.isStaff).toBe(true);
    });

    it('should return null role for non-admin user emails', () => {
        mockUseUser.mockReturnValue({
            user: { id: 'user-id', email: 'regular.user@example.com' },
            profile: { id: 'user-id', role: 'client' },
            isLoading: false
        });

        const { result } = renderHook(() => useAdmin());

        expect(result.current.role).toBeNull();
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isMaster).toBe(false);
        expect(result.current.isStaff).toBe(false);
    });

    it('should pass through isLoading, user, and profile states correctly', () => {
        const mockUser = { id: 'user-id', email: 'test@test.com' };
        const mockProfile = { id: 'user-id', role: 'trader' };

        mockUseUser.mockReturnValue({
            user: mockUser,
            profile: mockProfile,
            isLoading: true
        });

        const { result } = renderHook(() => useAdmin());

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.profile).toEqual(mockProfile);
        expect(result.current.isLoading).toBe(true);
    });
});
