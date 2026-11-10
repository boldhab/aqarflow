import React from 'react';
import Link from 'next/link';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Properties', href: '/properties' },
    { label: 'Leads', href: '/leads' },
    { label: 'Visits', href: '/visits' },
    { label: 'Deals', href: '/deals' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-900 text-slate-100 min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="px-3 py-4 text-xl font-bold tracking-tight text-white border-b border-slate-800">
          AqarFlow <span className="text-xs px-2 py-0.5 rounded bg-blue-600 ml-1">Workspace</span>
        </div>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
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
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
        Logged in as Agency Admin
      </div>
    </aside>
  );
};
