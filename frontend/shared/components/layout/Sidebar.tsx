'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/hooks';

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
}

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user, agency, role, logout, isLoading } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Properties', href: '/properties' },
    { label: 'Leads', href: '/leads' },
    { label: 'Visits', href: '/visits' },
    { label: 'Deals', href: '/deals' },
    { label: 'Team', href: '/team', adminOnly: true },
    { label: 'Agency Settings', href: '/settings', adminOnly: true },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && role !== 'ADMIN') {
      return false;
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-900 text-slate-100 min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="px-3 py-4 border-b border-slate-800">
          <div className="text-xl font-bold tracking-tight text-white flex items-center justify-between">
            <span data-testid="agency-name">{agency?.name || 'AqarFlow'}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-600 ml-1">Workspace</span>
          </div>
        </div>
        <nav className="mt-6 space-y-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="px-3 text-xs text-slate-400">
          <div className="font-semibold text-slate-200 text-sm truncate" data-testid="user-name">
            {user?.name || (isLoading ? 'Loading...' : 'Guest')}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span data-testid="user-role" className="uppercase">{role || 'GUEST'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          data-testid="logout-button"
          className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition flex items-center justify-between"
        >
          <span>Logout</span>
          <span className="text-xs text-slate-500">→</span>
        </button>
      </div>
    </aside>
  );
};
