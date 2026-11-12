'use client';

import React from 'react';
import { Plus, UserPlus, CalendarPlus, Handshake } from 'lucide-react';
import Link from 'next/link';
import { formatPKR, formatDate, formatAppointment } from '@/shared/lib';
import { useDashboard } from '../hooks';
import { useAuth } from '@/shared/hooks';
import {
  SkeletonStatCard,
  Alert,
  Badge,
  BadgeVariant,
  Button,
  EmptyState,
} from '@/shared/components/ui';
import { PageHeader } from '@/shared/components/layout';

export const DashboardView: React.FC = () => {
  const { data, loading, error } = useDashboard();
  const { user, agency, role } = useAuth();

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2 pb-6 border-b border-slate-200">
          <div className="h-8 bg-slate-200 rounded-lg w-56 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-72 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 h-72 animate-pulse" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6 h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title="Dashboard Error">
          {error}
        </Alert>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry Loading Dashboard
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      label: 'Available Properties',
      value: data.metrics.activeListings,
      subtext: `${data.metrics.totalProperties} total inventory`,
      trend: `${data.metrics.activeListings} live on portal`,
      icon: (
        <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      bg: 'bg-brand-50 border-brand-100',
      accentColor: 'hover:border-brand-400',
      href: '/inventory',
    },
    {
      label: 'Total Leads',
      value: data.metrics.totalLeads,
      subtext: `${data.metrics.totalLeads} client records`,
      trend: data.metrics.newLeadsThisMonth > 0 ? `+${data.metrics.newLeadsThisMonth} this month` : 'All time',
      trendPositive: true,
      icon: (
        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      bg: 'bg-emerald-50 border-emerald-100',
      accentColor: 'hover:border-emerald-400',
      href: '/leads',
    },
    {
      label: 'Scheduled Visits',
      value: data.metrics.scheduledVisits,
      subtext: 'Property inspections & showings',
      trend: 'Upcoming calendar',
      icon: (
        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      bg: 'bg-purple-50 border-purple-100',
      accentColor: 'hover:border-purple-400',
      href: '/visits',
    },
    {
      label: 'Won Deal Value',
      value: formatPKR(data.metrics.totalDealsValue),
      subtext: `${data.metrics.wonDealsCount} successful closings`,
      trend: `${data.metrics.wonDealsCount} won deals`,
      trendPositive: true,
      icon: (
        <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-amber-50 border-amber-100',
      accentColor: 'hover:border-amber-400',
      href: '/deals',
    },
  ];

  const getStageBadgeVariant = (stage: string): BadgeVariant => {
    switch (stage) {
      case 'NEW':
        return 'primary';
      case 'CONTACTED':
        return 'warning';
      case 'QUALIFIED':
        return 'success';
      case 'VISIT_SCHEDULED':
        return 'purple';
      case 'NEGOTIATION':
        return 'indigo';
      case 'CONVERTED':
        return 'success';
      case 'LOST':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Welcome Banner */}
      <PageHeader
        title={`Welcome back, ${user?.name || 'Agent'}`}
        subtitle={`${agency?.name ? `${agency.name} — ` : ''}Real estate operations overview, pipeline metrics, and client activity.`}
        badge={
          <Badge variant="primary" dot size="md">
            {role || 'AGENT'}
          </Badge>
        }
        actions={<div className="flex flex-wrap gap-2">
          {[{href:'/inventory?create=1',label:'Add Property',icon:Plus},{href:'/leads?create=1',label:'New Lead',icon:UserPlus},{href:'/visits?create=1',label:'Schedule Visit',icon:CalendarPlus},{href:'/deals?create=1',label:'Create Deal',icon:Handshake}].map((action,index)=><Link key={action.href} href={action.href} className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${index===0?'bg-brand-600 text-white hover:bg-brand-700':'border border-slate-200 bg-white text-slate-700 hover:bg-brand-50'}`}><action.icon size={16} aria-hidden="true"/>{action.label}</Link>)}
        </div>}

      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`group bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 ${card.accentColor} transition-all duration-200 flex flex-col justify-between`}
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
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">{card.subtext}</span>
              <span className="text-brand-600 font-semibold group-hover:translate-x-1 transition-transform flex-shrink-0">
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
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              <h2 className="text-base font-bold text-slate-900">Recent Inquiries &amp; Leads</h2>
            </div>
            <Link
              href="/leads"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1"
            >
              <span>View all leads</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="p-5 flex-1">
            {data.recentLeads.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                }
                title="No recent inquiries"
                description="Inquiries submitted via your public portal will automatically arrive here."
                action={
                  <Link href="/leads">
                    <Button variant="outline" size="sm">
                      Open Leads Pipeline
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href="/leads"
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group hover:bg-slate-50/60 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                          {lead.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(lead.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Badge
                        variant={getStageBadgeVariant(lead.stage)}
                        dot
                        size="sm"
                      >
                        {lead.stage.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Visits Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <h2 className="text-base font-bold text-slate-900">Upcoming Property Visits</h2>
            </div>
            <Link
              href="/visits"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1"
            >
              <span>View all visits</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="p-5 flex-1">
            {data.upcomingVisits.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                }
                title="No scheduled visits"
                description="Schedule viewings and inspections with active leads from your pipeline."
                action={
                  <Link href="/visits">
                    <Button variant="outline" size="sm">
                      Schedule a Visit
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.upcomingVisits.map((visit) => (
                  <Link
                    key={visit.id}
                    href="/visits"
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group hover:bg-slate-50/60 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                        {visit.propertyName}
                      </p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <span>Lead:</span>
                        <span className="font-medium text-slate-700">{visit.leadName}</span>
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                        <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatAppointment(visit.scheduledAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
