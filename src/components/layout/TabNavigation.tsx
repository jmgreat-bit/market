'use client';

import { DesktopHeader } from './DesktopHeader';
import { MobileTabBar } from './MobileTabBar';

interface TabNavigationProps {
    hasUnreadAlerts?: boolean;
}

export function TabNavigation({ hasUnreadAlerts = false }: TabNavigationProps) {
    return (
        <>
            <DesktopHeader hasUnreadAlerts={hasUnreadAlerts} />
            <MobileTabBar />
        </>
    );
}
