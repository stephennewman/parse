import React from 'react';
import AppLayout from '@/components/layout/AppLayout'; // Verify this path is correct

interface AppGroupLayoutProps {
    children: React.ReactNode;
}

export default function AppGroupLayout({ children }: AppGroupLayoutProps) {
    // File Purpose: This file sets up the layout for all authenticated (private) pages, including the sidebar and main content area.
    // Last updated: 2025-05-21
    // This component wraps all pages within the (app) group
    // with the AppLayout (which includes the sidebar).
    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
} 