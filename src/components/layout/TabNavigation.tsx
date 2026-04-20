'use client';

import { DesktopHeader } from './DesktopHeader';
import { MobileTabBar } from './MobileTabBar';

export function TabNavigation() {
    return (
        <>
            <DesktopHeader />
            <MobileTabBar />
        </>
    );
}
