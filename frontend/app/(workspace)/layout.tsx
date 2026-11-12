'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/shared/components/layout';
import { useAuth } from '@/shared/hooks';
import { useDialogFocus } from '@/shared/hooks/useDialogFocus';
import { usePathname } from 'next/navigation';

const SIDEBAR_STORAGE_KEY = 'aqarflow_sidebar_collapsed';

function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, agency, role, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  useDialogFocus(drawerRef, mobileSidebarOpen);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  // Restore sidebar collapse state from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setDesktopCollapsed(stored === 'true');
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, []);

  // Handle desktop collapse toggle with persistence
  const handleToggleDesktopCollapse = () => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Storage unavailable
      }
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileSidebarOpen(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);

  // Determine current section title
  const getSectionTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/inventory')) return 'Properties Inventory';
    if (pathname.startsWith('/leads')) return 'Leads & Inquiries';
    if (pathname.startsWith('/visits')) return 'Property Visits';
    if (pathname.startsWith('/deals')) return 'Deals Pipeline';
    return 'Workspace';
  };

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          isCollapsed={desktopCollapsed}
          onToggleCollapse={handleToggleDesktopCollapse}
        />
      </div>

      {/* Mobile Drawer Backdrop and Sidebar (approx 288px) */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          ref={drawerRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile workspace navigation"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-brand-950/75 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content: exactly 288px (w-72) */}
          <div className="relative flex-1 flex flex-col w-72 max-w-[85vw] bg-brand-900 shadow-2xl z-10 animate-slide-up">
            <div className="absolute top-3 right-3 z-20">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-brand-200 hover:text-white hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close sidebar navigation"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-nav">
          {/* Left: Mobile Toggle & Page Context */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Open sidebar navigation"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                {agency?.name || 'AqarFlow'}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-sm font-bold text-slate-800 truncate">
                {getSectionTitle()}
              </span>
            </div>
          </div>

          {/* Right: Quick Portal Link & User Pill */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <span>Public Portal</span>
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </Link>

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {role || 'AGENT'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function Layout({children}:{children:React.ReactNode}) { return <Suspense fallback={<p role="status" className="p-8">Loading workspace…</p>}><WorkspaceLayout>{children}</WorkspaceLayout></Suspense>; }
