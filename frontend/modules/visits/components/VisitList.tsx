'use client';

import React, { useState } from 'react';
import { Table, Column, Badge, BadgeVariant, Button } from '@/shared/components/ui';
import { formatDate } from '@/shared/lib';
import { VisitItem } from '../types';
import { useVisits } from '../hooks';

export const VisitList: React.FC = () => {
  const { visits, loading, error } = useVisits();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredVisits = visits.filter((v) => {
    if (filterStatus === 'ALL') return true;
    return v.status === filterStatus;
  });

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'SCHEDULED':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const columns: Column<VisitItem>[] = [
    {
      header: 'Property',
      cell: (item) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900 block">{item.property.title}</span>
          <span className="text-xs text-slate-400 font-mono">ID: {item.property.id.slice(0, 8)}...</span>
        </div>
      ),
    },
    {
      header: 'Client / Lead',
      cell: (item) => (
        <div>
          <span className="font-medium text-slate-800 block">{item.lead.name}</span>
          <span className="text-xs text-slate-500 font-mono">{item.lead.phone}</span>
        </div>
      ),
    },
    {
      header: 'Scheduled Date & Time',
      cell: (item) => (
        <div className="text-xs text-slate-700 whitespace-nowrap">
          <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-md inline-block">
            {formatDate(item.scheduledAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <Badge variant={getStatusBadgeVariant(item.status)} dot size="sm">
          {item.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Assigned Agent',
      cell: (item) => (
        <div className="text-xs text-slate-600 whitespace-nowrap">
          {item.agent?.name ? (
            <span className="font-medium text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                {item.agent.name.charAt(0).toUpperCase()}
              </span>
              {item.agent.name}
            </span>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scheduled Visits</h1>
            {!loading && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {visits.length}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage viewing appointments, on-site tours, and lead inspections
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Scheduled', value: 'SCHEDULED' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ].map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setFilterStatus(pill.value)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === pill.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="shadow-card rounded-xl overflow-hidden">
        <Table
          columns={columns}
          data={filteredVisits}
          keyExtractor={(v) => v.id}
          isLoading={loading}
          emptyMessage="No scheduled visits found"
          emptyDescription="When prospective buyers request viewings, appointments will appear here."
          emptyIcon={
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          caption="Scheduled property visits"
        />
      </div>
    </div>
  );
};
