"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Gauge, LayoutGrid, ListChecks, Database, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  href: string;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ href, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link href={href} className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium gap-2",
        isActive
          ? "bg-gray-200 text-gray-900"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}>
      {children}
    </Link>
  );
};

export default function AppLayout({ children }: AppLayoutProps) {
  // Define heights and widths for layout calculations (adjust as needed)
  // const headerHeight = 'h-16'; // Remove unused constant
  const sidebarWidth = 'w-64'; // Example: 16rem or 256px

  const router = useRouter();
  const supabase = createClientComponentClient();

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
            <img
              src="https://www.checkit.net/hubfs/website/img/brand/checkit-logo-horizontal-standard-rgb-blue.svg"
              alt="Checkit Logo"
              className="h-16 w-auto" // Set height to h-16, width auto maintains aspect ratio
            />
          </div>
          
          {/* Navigation Area - occupies most space */}
          <div className="flex-grow">
            <nav>
              <ul>
                <li>
                  <NavItem href="/">
                    <Gauge className="h-5 w-5" />
                    Dashboard
                  </NavItem>
                </li>
                <li>
                  <NavItem href="/forms">
                    <LayoutGrid className="h-5 w-5" />
                    Forms
                  </NavItem>
                </li>
                <li>
                  <NavItem href="/submissions">
                    <ListChecks className="h-5 w-5" />
                    Submissions
                  </NavItem>
                </li>
                <li>
                  <NavItem href="/labels">
                    <Tag className="h-5 w-5" />
                    Labels
                  </NavItem>
                </li>
                <li>
                  <NavItem href="/data">
                    <Database className="h-5 w-5" />
                    Data
                  </NavItem>
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
      <div className={`flex flex-col flex-grow ml-64`}> {/* Changed to static class */}
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
