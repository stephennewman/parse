import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

// File Purpose: This file sets up the layout for all public-facing pages, ensuring a clean and simple look for users who are not logged in.
// Last updated: 2025-05-21

// This layout applies to all routes within the (public) group.
// It does NOT include the sidebar/AppLayout.
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-4">
       {/* Center content for simple public pages like forms */}
      <main className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-lg shadow-md">
          {children}
      </main>
    </div>
  );
} 