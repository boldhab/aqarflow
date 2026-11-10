'use client';

import React from 'react';
import { Table, Column } from '@/shared/components/ui';
import { formatDate } from '@/shared/lib';
import { VisitItem } from '../types';
import { useVisits } from '../hooks';

export const VisitList: React.FC = () => {
  const { visits, loading, error } = useVisits();

  const columns: Column<VisitItem>[] = [
    { header: 'Property', cell: (item) => item.property.title },
    { header: 'Lead', cell: (item) => item.lead.name },
    { header: 'Scheduled At', cell: (item) => formatDate(item.scheduledAt) },
    {
      header: 'Status',
      cell: (item) => (
        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800 font-medium">
          {item.status}
        </span>
      ),
    },
    { header: 'Agent', cell: (item) => item.agent?.name || 'Unassigned' },
  ];

  if (loading) return <div className="p-4 text-slate-500">Loading visits...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Scheduled Visits</h1>
      <Table columns={columns} data={visits} keyExtractor={(v) => v.id} />
    </div>
  );
};
