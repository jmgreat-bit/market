import { useUser } from './useUser';

export type AdminRole = 'master' | 'staff' | null;

export function useAdmin() {
    const { user, profile, isLoading } = useUser();

    const getAdminRole = (): AdminRole => {
        if (!user?.email) return null;
        
        // Master admin (hardcoded as requested)
        if (user.email === 'thegreat@admin.sir') {
            return 'master';
        }
        
        // Staff accounts
        if (user.email.endsWith('@staff.marketplc.com')) {
            return 'staff';
        }
        
        return null;
    };

    const role = getAdminRole();

    return {
        isAdmin: role !== null,
        isMaster: role === 'master',
        isStaff: role === 'staff',
        role,
        user,
        profile,
        isLoading
    };
}
