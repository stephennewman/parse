"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  // Define heights and widths for layout calculations (adjust as needed)
  const headerHeight = 'h-16'; // Example: 4rem or 64px
  const sidebarWidth = 'w-64'; // Example: 16rem or 256px

  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex"> {/* Use flex for sidebar+main */}
      {/* Fixed Sidebar - Full height */}
      <aside className={`fixed top-0 left-0 ${sidebarWidth} h-full bg-white border-r border-gray-200 z-40 flex flex-col`}> {/* Removed pt-16 */}
        {/* Sidebar content container - takes full height */}
        <div className="flex flex-col h-full p-4 pt-6"> {/* Added some top padding back for content */}
          {/* App Title Area */}
          <div className="mb-6 px-3"> {/* Added title here with bottom margin */}
            <div className="font-semibold text-lg text-gray-800">Parse</div>
          </div>
          
          {/* Navigation Area - occupies most space */}
          <div className="flex-grow">
            <nav>
              <ul>
                <li>
                  <Link href="/" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium cursor-pointer">
                    {/* Add an icon later if desired */}
                    Home
                  </Link>
                </li>
                {/* Add more navigation links here */}
              </ul>
            </nav>
          </div>

          {/* Sign Out Button Area - fixed at bottom */}
          <div className="mt-auto"> {/* Pushes button to the bottom */} 
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
              {/* Add an icon later if desired */}
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area Wrapper (for header and content) */}
      <div className={`flex flex-col flex-grow ml-${sidebarWidth.split('-')[1]}`}> {/* Added ml to offset sidebar */}
        {/* Header removed */}
        
        {/* Main Content - Removed extra top padding */}
        <main className={`flex-grow container mx-auto p-4 md:p-6`}>
          {children}
        </main>
      </div>

      {/* Footer can be added back here later if needed (consider sidebar offset) */}
    </div>
  );
}
