'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  ExternalLink,
  LogOut,
  Building2,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks';
import { Modal, Button, Badge } from '@/shared/components/ui';
import { cn } from '../../lib/utils';
import {
  WORKSPACE_NAVIGATION,
  NavSection,
  NavItem,
  SubNavItem,
} from './nav-config';

export interface SidebarProps {
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const { user, agency, role, logout, isLoading } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Expanded parent groups (item.id -> boolean)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Sign out modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Helper to determine if an item is active
  const isItemActive = (href: string): boolean => {
    if (href === '/') return false;
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      if (true) {
        const currentParams = new URLSearchParams(queryString);
        const targetParams = new URLSearchParams(query);
        for (const [k, v] of targetParams.entries()) {
          if (currentParams.get(k) !== v) return false;
        }
        return true;
      }
      return false;
    }
    return (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))) && !searchParams.has('purpose') && !searchParams.has('view');
  };

  // Helper to check if any child of a parent item is active
  const isChildActive = (item: NavItem): boolean => {
    if (!item.items || item.items.length === 0) return false;
    return item.items.some((sub) => isItemActive(sub.href));
  };

  // Auto-expand parent group if a child route is active on page load or navigation
  useEffect(() => {
    WORKSPACE_NAVIGATION.forEach((section) => {
      section.items.forEach((item) => {
        if (isChildActive(item)) {
          setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
        }
      });
    });
  }, [pathname, queryString]);

  // Global Keyboard Shortcuts: Ctrl+B / Cmd+B to toggle sidebar, Ctrl+K to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar shortcut (Ctrl+B or Cmd+B)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleCollapse?.();
      }

      // Focus search shortcut (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isCollapsed && onToggleCollapse) {
          onToggleCollapse();
        }
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // Clear search on Escape
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse, isCollapsed, searchQuery]);

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.push('/login');
    } catch {
      window.location.href = '/login';
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Toggle group expansion
  const toggleGroup = (itemId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Live navigation search filtering
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return WORKSPACE_NAVIGATION;

    return WORKSPACE_NAVIGATION.map((section) => {
      const filteredItems: NavItem[] = [];
      section.items.forEach((item) => {
        const itemMatches = item.label.toLowerCase().includes(query);
        const matchingChildren = item.items?.filter((sub) =>
          sub.label.toLowerCase().includes(query)
        );

        if (itemMatches) {
          filteredItems.push(item);
        } else if (matchingChildren && matchingChildren.length > 0) {
          filteredItems.push({
            ...item,
            items: matchingChildren,
          });
        }
      });

      return {
        ...section,
        items: filteredItems,
      };
    }).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  // When searching, auto-expand any groups that match
  useEffect(() => {
    if (searchQuery.trim()) {
      const toExpand: Record<string, boolean> = {};
      filteredSections.forEach((section) => {
        section.items.forEach((item) => {
          if (item.items && item.items.length > 0) {
            toExpand[item.id] = true;
          }
        });
      });
      setExpandedGroups((prev) => ({ ...prev, ...toExpand }));
    }
  }, [searchQuery, filteredSections]);

  // Highlight search query safely in label without dangerouslySetInnerHTML
  const renderHighlightedText = (text: string) => {
    const query = searchQuery.trim();
    if (!query) return text;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={index}
              className="bg-brand-500/30 text-brand-200 font-semibold rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Check role-based permission
  const hasPermission = (allowedRoles?: ('ADMIN' | 'AGENT')[]) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const currentRole = role || user?.role;
    if (!currentRole) return true;
    return allowedRoles.includes(currentRole as 'ADMIN' | 'AGENT');
  };

  return (
    <>
      <aside
        className={cn(
          'relative h-screen sticky top-0 border-r border-brand-700/90 bg-brand-900 text-brand-50 flex flex-col justify-between select-none transition-all duration-300 ease-in-out z-30',
          isCollapsed ? 'w-14' : 'w-64'
        )}
        aria-label="Admin Workspace Sidebar"
      >
        {/* =========================================================================
            CRITICAL REQUIREMENT: Floating Collapse/Expand Toggle
            - Attached to the outer right edge of the sidebar
            - Vertically centered at 50% of the sidebar height
            - Moves smoothly as the sidebar width changes
            - Remains centered at 50% of viewport height as page scrolls
            ========================================================================= */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'hidden lg:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-40',
              'w-6 h-6 rounded-full bg-brand-800 border border-brand-600/90 text-brand-200',
              'hover:text-white hover:bg-brand-700 hover:border-brand-500/80 hover:shadow-md',
              'shadow-sm transition-all duration-200 active:scale-95 cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900'
            )}
            aria-label={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Top Header & Navigation Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header Brand */}
          <div
            className={cn(
              'h-16 flex items-center border-b border-brand-700/80 flex-shrink-0 transition-all px-3.5',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm shadow-brand-900/30">
                A
              </span>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div
                    className="text-sm font-bold text-white truncate tracking-tight"
                    data-testid="agency-name"
                  >
                    {agency?.name || 'AqarFlow'}
                  </div>
                  <div className="text-[11px] text-brand-200 font-medium tracking-wide">
                    Enterprise CRM
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Search Input (Expanded) or Search Trigger (Collapsed) */}
          <div className="px-3 pt-3.5 pb-1 flex-shrink-0">
            {!isCollapsed ? (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-200 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search... (Ctrl+K)"
                  className="w-full bg-brand-800/90 border border-brand-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-brand-100 placeholder:text-brand-300 transition-colors focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  aria-label="Search navigation"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-200 hover:text-white p-0.5 rounded"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onToggleCollapse?.();
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }}
                className="w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-brand-200 hover:text-white hover:bg-brand-800 transition-colors"
                title="Search navigation (Ctrl+K)"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin">
            {filteredSections.length === 0 ? (
              <div className="py-8 px-2 text-center space-y-2">
                <p className="text-xs text-brand-200">
                  No menus matching &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              filteredSections.map((section) => {
                if (!hasPermission(section.roles)) return null;

                return (
                  <div key={section.id} className="space-y-1">
                    {/* Section Heading (Expanded only) */}
                    {!isCollapsed && (
                      <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-300 select-none">
                        {section.title}
                      </div>
                    )}

                    {/* Section Items */}
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        if (!hasPermission(item.roles)) return null;

                        const IconComponent: LucideIcon = item.icon || Building2;
                        const hasChildren = item.items && item.items.length > 0;
                        const active = isItemActive(item.href);
                        const childActive = isChildActive(item);
                        const isExpanded = !!expandedGroups[item.id];

                        // Top-level Navigation Link/Button
                        return (
                          <div key={item.id} className="relative group">
                            {hasChildren && !isCollapsed ? (
                              // Expandable Parent Menu (has children)
                              <button
                                type="button"
                                onClick={() => toggleGroup(item.id)}
                                className={cn(
                                  'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                                  active || childActive
                                    ? 'text-white bg-brand-800/90 font-semibold border-l-2 border-brand-500'
                                    : 'text-brand-200 hover:text-brand-50 hover:bg-brand-800/60'
                                )}
                                aria-expanded={isExpanded}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <IconComponent
                                    className={cn(
                                      'h-4 w-4 flex-shrink-0 transition-colors',
                                      active || childActive
                                        ? 'text-brand-400'
                                        : 'text-brand-200 group-hover:text-brand-100'
                                    )}
                                  />
                                  <span className="truncate">
                                    {renderHighlightedText(item.label)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {item.badge && (
                                    <span
                                      className={cn(
                                        'px-1.5 py-0.5 text-[10px] font-bold rounded-md',
                                        item.badgeVariant === 'emerald'
                                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-brand-700 text-brand-200'
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                  <ChevronDown
                                    className={cn(
                                      'h-3.5 w-3.5 text-brand-200 transition-transform duration-200',
                                      isExpanded && 'rotate-180'
                                    )}
                                  />
                                </div>
                              </button>
                            ) : (
                              // Direct Link (no children or collapsed mode)
                              <Link
                                href={item.href}
                                onClick={onCloseMobile}
                                target={item.external ? '_blank' : undefined}
                                rel={item.external ? 'noopener noreferrer' : undefined}
                                className={cn(
                                  'flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 relative',
                                  isCollapsed ? 'justify-center w-9 h-9 mx-auto' : 'text-xs font-medium',
                                  // CRITICAL: Orange accent for active items
                                  active
                                    ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-950/30'
                                    : childActive
                                    ? 'text-white bg-brand-800 font-medium'
                                    : 'text-brand-200 hover:text-brand-50 hover:bg-brand-800/70'
                                )}
                                aria-current={active ? 'page' : undefined}
                              >
                                <IconComponent
                                  className={cn(
                                    'h-4 w-4 flex-shrink-0 transition-colors',
                                    active
                                      ? 'text-white'
                                      : childActive
                                      ? 'text-brand-400'
                                      : 'text-brand-200 group-hover:text-brand-100'
                                  )}
                                />
                                {!isCollapsed && (
                                  <>
                                    <span className="truncate flex-1">
                                      {renderHighlightedText(item.label)}
                                    </span>
                                    {item.external && (
                                      <ExternalLink className="h-3 w-3 text-brand-200 flex-shrink-0" />
                                    )}
                                    {item.badge && !item.external && (
                                      <span
                                        className={cn(
                                          'px-1.5 py-0.5 text-[10px] font-bold rounded-md flex-shrink-0',
                                          item.badgeVariant === 'emerald'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-brand-700 text-brand-200'
                                        )}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </>
                                )}
                              </Link>
                            )}

                            {/* Collapsed Mode Floating Tooltip */}
                            {isCollapsed && (
                              <div
                                role="tooltip"
                                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-800 text-brand-50 text-xs font-semibold rounded-lg shadow-xl border border-brand-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex items-center gap-1.5"
                              >
                                <span>{item.label}</span>
                                {item.badge && (
                                  <span className="text-[10px] text-emerald-400 font-bold">
                                    ({item.badge})
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Nested Sub-items (Expanded Mode) */}
                            {hasChildren && !isCollapsed && isExpanded && (
                              <div className="ml-5 pl-3 mt-1 space-y-0.5 border-l border-brand-700/80">
                                {item.items!.map((sub: SubNavItem) => {
                                  if (!hasPermission(sub.roles)) return null;
                                  const subActive = isItemActive(sub.href);

                                  return (
                                    <Link
                                      key={sub.id}
                                      href={sub.href}
                                      onClick={onCloseMobile}
                                      className={cn(
                                        'block px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                                        // Orange accent for active nested items
                                        subActive
                                          ? 'text-brand-400 font-semibold bg-brand-500/10 border-l-2 border-brand-500 -ml-[13px] pl-3'
                                          : 'text-brand-200 hover:text-brand-100 hover:bg-brand-800/50'
                                      )}
                                      aria-current={subActive ? 'page' : undefined}
                                    >
                                      {renderHighlightedText(sub.label)}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* User Profile Footer (Fixed at bottom) */}
        <div className="p-2.5 border-t border-brand-700/80 bg-brand-900/95 space-y-2 flex-shrink-0">
          {/* Quick Public Portal Link */}
          {!isCollapsed && (
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-brand-200 hover:text-brand-50 hover:bg-brand-800/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-brand-200" />
                <span>Public Marketplace</span>
              </span>
              <span className="text-[10px] text-brand-200 font-mono">↗</span>
            </Link>
          )}

          {/* User Account Info Pill */}
          <div
            className={cn(
              'px-2 py-1.5 flex items-center gap-2.5 rounded-xl bg-brand-800/70 border border-brand-700/60',
              isCollapsed && 'justify-center px-1'
            )}
          >
            <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/30 text-brand-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div
                  className="font-semibold text-brand-100 text-xs truncate"
                  data-testid="user-name"
                >
                  {user?.name || (isLoading ? 'Loading...' : 'Agent')}
                </div>
                <div className="text-[10px] text-brand-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span data-testid="user-role" className="uppercase font-semibold tracking-wide">
                    {role || 'AGENT'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button (Opens Confirmation Modal) */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            data-testid="logout-button"
            title={isCollapsed ? 'Sign Out' : undefined}
            className={cn(
              'w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors flex items-center',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
            aria-label="Sign out of workspace"
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </span>
            {!isCollapsed && <span className="text-brand-300 text-xs">&rarr;</span>}
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => !loggingOut && setShowLogoutModal(false)}
        title="Sign Out Confirmation"
        description="Are you sure you want to end your current workspace session?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={loggingOut}
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={loggingOut}
              onClick={handleLogout}
            >
              Confirm Sign Out
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          You will need your agency credentials to sign back into this workspace.
        </p>
      </Modal>
    </>
  );
};
