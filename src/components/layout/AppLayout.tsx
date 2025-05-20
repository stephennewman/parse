"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Gauge, LayoutGrid, ListChecks, Database, Tag, Rss, FileText, Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
          <div className="mb-2 px-1 flex items-center justify-center">
            <img
              src="https://s3.ca-central-1.amazonaws.com/logojoy/logos/220875599/noBgColor.png?5663.5999999940395"
              alt="App Logo"
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
                    Website
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
      <button
        className={cn(
          "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium gap-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900",
          open ? "bg-gray-100" : ""
        )}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="forms-subnav"
        type="button"
      >
        <LayoutGrid className="h-5 w-5" />
        Forms
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0")} />
      </button>
      {open && (
        <ul id="forms-subnav" className="pl-8 py-1 space-y-1">
          <li>
            <NavItem href="/forms">
              <span className={isActive("/forms") ? "font-semibold" : ""}>Forms</span>
            </NavItem>
          </li>
          <li>
            <NavItem href="/submissions">
              <span className={isActive("/submissions") ? "font-semibold" : ""}>Submissions</span>
            </NavItem>
          </li>
          <li>
            <NavItem href="/data">
              <span className={isActive("/data") ? "font-semibold" : ""}>Form Fields</span>
            </NavItem>
          </li>
          <li>
            <NavItem href="/labels">
              <span className={isActive("/labels") ? "font-semibold" : ""}>Labels</span>
            </NavItem>
          </li>
        </ul>
      )}
    </li>
  );
}
