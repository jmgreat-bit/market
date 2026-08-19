'use client';

import { DesktopHeader } from './DesktopHeader';
import { MobileTabBar } from './MobileTabBar';

interface TabNavigationProps {
    unreadAlertsCount?: number;
}

export function TabNavigation({ unreadAlertsCount = 0 }: TabNavigationProps) {
    return (
        <>
            <DesktopHeader unreadAlertsCount={unreadAlertsCount} />
            <MobileTabBar />
        </>
    );
}
