'use client';

import React, { useState } from 'react';
import { Table, Column, Badge, BadgeVariant } from '@/shared/components/ui';
import { formatCurrency, formatDate } from '@/shared/lib';
import { DealItem } from '../types';
import { useDeals } from '../hooks';

export const DealList: React.FC = () => {
  const { deals, loading, error } = useDeals();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredDeals = deals.filter((d) => {
    if (statusFilter === 'ALL') return true;
    return d.status === statusFilter;
  });

  const totalValue = deals.reduce((acc, d) => acc + Number(d.value || 0), 0);
  const wonValue = deals
    .filter((d) => d.status === 'WON')
    .reduce((acc, d) => acc + Number(d.value || 0), 0);
  const openCount = deals.filter((d) => d.status === 'OPEN').length;

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'WON':
        return 'success';
      case 'OPEN':
        return 'warning';
      case 'LOST':
        return 'danger';
      default:
        return 'default';
    }
  };

  const columns: Column<DealItem>[] = [
    {
      header: 'Property',
      cell: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block">{item.property.title}</span>
          <span className="text-xs text-slate-400 font-mono">ID: {item.property.id.slice(0, 8)}...</span>
        </div>
      ),
    },
    {
      header: 'Client / Buyer',
      cell: (item) => (
        <span className="font-medium text-slate-800">{item.lead.name}</span>
      ),
    },
    {
      header: 'Deal Value',
      cell: (item) => (
        <span className="font-extrabold text-slate-900 font-mono text-sm">
          {formatCurrency(item.value)}
        </span>
      ),
    },
    {
      header: 'Pipeline Status',
      cell: (item) => (
        <Badge variant={getStatusBadgeVariant(item.status)} dot size="sm">
          {item.status}
        </Badge>
      ),
    },
    {
      header: 'Created On',
      cell: (item) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      header: 'Closing Date',
      cell: (item) => (
        <span className="text-xs text-slate-500 font-mono">
          {item.closedAt ? formatDate(item.closedAt) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deals &amp; Closings</h1>
            {!loading && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {deals.length}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Track commercial negotiations, transactions, and commission pipelines
          </p>
        </div>

        {/* Status Filters */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {[
            { label: 'All Deals', value: 'ALL' },
            { label: 'Open', value: 'OPEN' },
            { label: 'Won', value: 'WON' },
            { label: 'Lost', value: 'LOST' },
          ].map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setStatusFilter(pill.value)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === pill.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Strip */}
      {!loading && deals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Total Pipeline Value</span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(totalValue)}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-emerald-700 font-semibold block">Closed &amp; Won Revenue</span>
            <span className="text-xl font-extrabold text-emerald-900 mt-1 block">
              {formatCurrency(wonValue)}
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-amber-700 font-semibold block">Active Negotiations</span>
            <span className="text-xl font-extrabold text-amber-900 mt-1 block">
              {openCount} Open Deals
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="shadow-card rounded-xl overflow-hidden">
        <Table
          columns={columns}
          data={filteredDeals}
          keyExtractor={(d) => d.id}
          isLoading={loading}
          emptyMessage="No deals found"
          emptyDescription="Transactions will appear here when negotiations advance to contract closing."
          emptyIcon={
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          caption="Deals and transaction closings"
        />
      </div>
    </div>
  );
};
