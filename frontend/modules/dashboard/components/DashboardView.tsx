'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/shared/lib';
import { useDashboard } from '../hooks';

export const DashboardView: React.FC = () => {
  const { data, loading, error } = useDashboard();

  if (loading) return <div className="p-4 text-slate-500">Loading dashboard overview...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  if (!data) return null;

  const statCards = [
    { label: 'Active Listings', value: data.metrics.activeListings },
    { label: 'Total Leads', value: data.metrics.totalLeads },
    { label: 'Scheduled Visits', value: data.metrics.scheduledVisits },
    { label: 'Won Deals Volume', value: formatCurrency(data.metrics.totalDealsValue) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Recent Leads</h2>
          <div className="space-y-2">
            {data.recentLeads.map((l) => (
              <div key={l.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800">{l.name}</span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{l.stage}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Upcoming Visits</h2>
          <div className="space-y-2">
            {data.upcomingVisits.map((v) => (
              <div key={v.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-800">{v.propertyName}</p>
                  <p className="text-xs text-slate-400">Lead: {v.leadName}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDate(v.scheduledAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
