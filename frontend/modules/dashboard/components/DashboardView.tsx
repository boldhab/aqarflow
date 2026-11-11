'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/shared/lib';
import { useDashboard } from '../hooks';
import { useAuth } from '@/shared/hooks';
import { SkeletonStatCard, Alert } from '@/shared/components/ui';

export const DashboardView: React.FC = () => {
  const { data, loading, error } = useDashboard();
  const { user, agency, role } = useAuth();

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 h-64 animate-pulse" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6 h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Dashboard Error">
          {error}
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      label: 'Active Listings',
      value: data.metrics.activeListings,
      subtext: `${data.metrics.totalProperties} total inventory`,
      icon: (
        <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      bg: 'bg-brand-50 border-brand-100',
      href: '/properties',
    },
    {
      label: 'Total Leads',
      value: data.metrics.totalLeads,
      subtext: `+${data.metrics.newLeadsThisMonth} new this month`,
      icon: (
        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      bg: 'bg-emerald-50 border-emerald-100',
      href: '/leads',
    },
    {
      label: 'Scheduled Visits',
      value: data.metrics.scheduledVisits,
      subtext: 'Property inspections & showings',
      icon: (
        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      bg: 'bg-purple-50 border-purple-100',
      href: '/visits',
    },
    {
      label: 'Won Deals Volume',
      value: formatCurrency(data.metrics.totalDealsValue),
      subtext: `${data.metrics.wonDealsCount} successful closings`,
      icon: (
        <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-amber-50 border-amber-100',
      href: '/deals',
    },
  ];

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'NEW':
        return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'CONTACTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'QUALIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VISIT_SCHEDULED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'NEGOTIATION':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'CONVERTED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'LOST':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Agent'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wide">
              {role || 'AGENT'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {agency?.name ? `${agency.name} — ` : ''}Real estate operational overview &amp; pipeline metrics
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl shadow-sm hover:bg-brand-700 transition"
          >
            <span>+</span>
            <span>Add Property</span>
          </Link>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition"
          >
            <span>Leads CRM</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:border-brand-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.bg}`}>
                  {card.icon}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">{card.subtext}</span>
              <span className="text-brand-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* 2-Column Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Leads</h2>
              <p className="text-xs text-slate-500 mt-0.5">Inquiries received from your public listings</p>
            </div>
            <Link
              href="/leads"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 transition"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="p-5 flex-1 divide-y divide-slate-100">
            {data.recentLeads.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No recent inquiries yet
              </div>
            ) : (
              data.recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {lead.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStageBadgeColor(
                      lead.stage
                    )} whitespace-nowrap`}
                  >
                    {lead.stage.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Visits Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Visits</h2>
              <p className="text-xs text-slate-500 mt-0.5">Scheduled physical property inspections</p>
            </div>
            <Link
              href="/visits"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 transition"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="p-5 flex-1 divide-y divide-slate-100">
            {data.upcomingVisits.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No visits scheduled at the moment
              </div>
            ) : (
              data.upcomingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {visit.propertyName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      Lead: <span className="font-medium text-slate-700">{visit.leadName}</span>
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                      {formatDate(visit.scheduledAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
