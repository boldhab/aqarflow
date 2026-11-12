'use client';

import React, { useState } from 'react';
import {
  Table,
  Column,
  Badge,
  BadgeVariant,
  Button,
  Modal,
  Alert,
} from '@/shared/components/ui';
import { PageHeader } from '@/shared/components/layout';
import { formatPKR, formatDate } from '@/shared/lib';
import { DealItem } from '../types';
import { useDeals } from '../hooks';

export const DealList: React.FC = () => {
  const { deals, loading, error, refetch } = useDeals();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);

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
          <span className="font-semibold text-slate-900 block truncate max-w-[240px]">
            {item.property.title}
          </span>
          <span className="text-xs text-brand-600 font-mono font-bold bg-brand-50 px-1.5 py-0.2 rounded border border-brand-100 inline-block">
            {item.property.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      header: 'Client / Buyer',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {item.lead.name ? item.lead.name.charAt(0).toUpperCase() : 'B'}
          </div>
          <span className="font-medium text-slate-900">{item.lead.name}</span>
        </div>
      ),
    },
    {
      header: 'Deal Value',
      cell: (item) => (
        <span className="font-extrabold text-slate-900 font-mono text-sm">
          {formatPKR(item.value)}
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
      header: 'Created Date',
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
    {
      header: 'Actions',
      align: 'right',
      cell: (item) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => setSelectedDeal(item)}
        >
          Details
        </Button>
      ),
    },
  ];

  if (error) return <Alert variant="error" title="Unable to load deals"><p>The service is temporarily unavailable. Please try again.</p><Button variant="outline" className="mt-3" onClick={refetch}>Retry</Button></Alert>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Deals &amp; Closings"
        subtitle="Track commercial negotiations, signed agreements, and closed transaction revenue."
        badge={
          !loading && (
            <Badge variant="default" size="md">
              {deals.length} Total
            </Badge>
          )
        }
        actions={
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold border border-slate-200/80">
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
        }
      />

      {/* KPI Overview Cards */}
      {!loading && deals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Total Pipeline Volume
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatPKR(totalValue)}
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">{deals.length} transactions in pipeline</span>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 bg-emerald-50/20">
            <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider block">
              Closed &amp; Won Revenue
            </span>
            <span className="text-2xl font-extrabold text-emerald-800 mt-1 block">
              {formatPKR(wonValue)}
            </span>
            <span className="text-xs text-emerald-600 mt-0.5 block">Successfully closed transactions</span>
          </div>
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 bg-amber-50/20">
            <span className="text-xs text-amber-700 font-semibold uppercase tracking-wider block">
              Active Negotiations
            </span>
            <span className="text-2xl font-extrabold text-amber-800 mt-1 block">
              {openCount} Open Deals
            </span>
            <span className="text-xs text-amber-600 mt-0.5 block">Pending final contract closing</span>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Main Standardized Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={filteredDeals}
          keyExtractor={(d) => d.id}
          isLoading={loading}
          skeletonRows={5}
          emptyMessage="No deals found"
          emptyDescription="Transactions will appear here when negotiations advance to contract closing."
          emptyIcon={
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
          caption="Deals and transaction closings"
        />
      </div>

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <Modal
          isOpen={Boolean(selectedDeal)}
          onClose={() => setSelectedDeal(null)}
          title="Deal Details"
          description={`Transaction for ${selectedDeal.property.title}`}
          size="md"
          footer={
            <div className="flex justify-end w-full">
              <Button variant="secondary" size="sm" onClick={() => setSelectedDeal(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Buyer / Client</span>
                <span className="font-bold text-slate-900">{selectedDeal.lead.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Deal Status</span>
                <Badge variant={getStatusBadgeVariant(selectedDeal.status)} dot size="sm">
                  {selectedDeal.status}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Transaction Value</span>
                <span className="font-extrabold text-slate-900 text-base">
                  {formatPKR(selectedDeal.value)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Created Date</span>
                <span className="font-mono text-xs text-slate-700">{formatDate(selectedDeal.createdAt)}</span>
              </div>
            </div>

            <div className="border border-brand-100 bg-brand-50/50 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider block">
                Target Property
              </span>
              <div className="font-bold text-slate-900">{selectedDeal.property.title}</div>
            </div>

            {selectedDeal.closedAt && (
              <div className="text-xs text-slate-500">
                Closed on: <strong className="text-slate-800 font-mono">{formatDate(selectedDeal.closedAt)}</strong>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
