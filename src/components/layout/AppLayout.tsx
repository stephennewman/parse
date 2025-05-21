"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Gauge, LayoutGrid, ListChecks, Database, Tag, Rss, FileText, Globe, ChevronDown, List } from 'lucide-react';
import { cn } from '@/lib/utils';

// File Purpose: This component provides the main app layout, including the sidebar, header, and content area for logged-in users.
// Last updated: 2025-05-21

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  href: string;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ href, children }) => {
  const pathname = usePathname() ?? "";
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
        <div className="flex flex-col h-full p-4 pt-2"> {/* Reduced top padding to move logo up */}
          {/* App Title Area */}
          <div className="mb-2 px-1 flex flex-col items-center justify-center">
            <img
              src="https://blog.krezzo.com/hs-fs/hubfs/Krezzo-Logo-2023-Light.png?width=3248&height=800&name=Krezzo-Logo-2023-Light.png"
              alt="Krezzo Logo"
              className="h-20 w-auto object-contain"
              style={{ maxWidth: 200 }}
            />
          </div>
          
          {/* Navigation Area - occupies most space */}
          <div className="flex-grow">
            <nav>
              <ul>
                <li>
                  <NavItem href="/">
                    <Gauge className="h-5 w-5" />
                    Home
                  </NavItem>
                </li>
                <li>
                  <NavItem href="/sites">
                    <Globe className="h-5 w-5" />
                    Sites
                  </NavItem>
                </li>
                <FormsNav />
                <li>
                  <NavItem href="/sensors">
                    <Rss className="h-5 w-5" />
                    Sensors
                  </NavItem>
                </li>
                <li>
                  <NavItem href="/labels">
                    <Tag className="h-5 w-5" />
                    Labels
                  </NavItem>
                </li>
                <li>
                  <NavItem href="/reporting">
                    <FileText className="h-5 w-5" />
                    Reporting
                  </NavItem>
                </li>
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

function FormsNav() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(pathname.startsWith("/forms") || pathname.startsWith("/submissions") || pathname.startsWith("/data") || pathname.startsWith("/labels"));
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return (
    <li>
      <div className="flex items-center w-full">
        <Link
          href="/forms"
          className={cn(
            "flex items-center flex-1 px-3 py-2 rounded-md text-sm font-medium gap-2",
            isActive("/forms") ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <LayoutGrid className="h-5 w-5" />
          Forms
        </Link>
        <button
          className={cn(
            "ml-1 p-1 rounded hover:bg-gray-100",
            open ? "bg-gray-100" : ""
          )}
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-controls="forms-subnav"
          type="button"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0")} />
        </button>
      </div>
      {open && (
        <ul id="forms-subnav" className="pl-8 py-1 space-y-1">
          <li>
            <NavItem href="/forms/submissions">
              <ListChecks className="h-5 w-5" />
              Submissions
            </NavItem>
          </li>
          <li>
            <NavItem href="/data">
              <List className="h-5 w-5" />
              <span className={isActive("/data") ? "font-semibold" : ""}>Form Fields</span>
            </NavItem>
          </li>
        </ul>
      )}
    </li>
  );
}
