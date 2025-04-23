import React from 'react';
import AppLayout from '@/components/layout/AppLayout'; // Verify this path is correct

interface AppGroupLayoutProps {
    children: React.ReactNode;
}

export default function AppGroupLayout({ children }: AppGroupLayoutProps) {
    // This component wraps all pages within the (app) group
    // with the AppLayout (which includes the sidebar).
    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
} 