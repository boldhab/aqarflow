'use client';

import React from 'react';
import { Table, Column } from '@/shared/components/ui';
import { formatCurrency, formatDate } from '@/shared/lib';
import { DealItem } from '../types';
import { useDeals } from '../hooks';

export const DealList: React.FC = () => {
  const { deals, loading, error } = useDeals();

  const columns: Column<DealItem>[] = [
    { header: 'Property', cell: (item) => item.property.title },
    { header: 'Lead', cell: (item) => item.lead.name },
    { header: 'Value', cell: (item) => formatCurrency(item.value) },
    {
      header: 'Status',
      cell: (item) => {
        const colors = {
          OPEN: 'bg-yellow-100 text-yellow-800',
          WON: 'bg-green-100 text-green-800',
          LOST: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${colors[item.status]}`}>
            {item.status}
          </span>
        );
      },
    },
    { header: 'Created', cell: (item) => formatDate(item.createdAt) },
  ];

  if (loading) return <div className="p-4 text-slate-500">Loading deals...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Deals & Closings</h1>
      <Table columns={columns} data={deals} keyExtractor={(d) => d.id} />
    </div>
  );
};
