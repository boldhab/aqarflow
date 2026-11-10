'use client';

import React from 'react';
import { Table, Column } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/lib';
import { PropertyItem } from '../types';
import { useProperties } from '../hooks';

export const PropertyList: React.FC = () => {
  const { properties, loading, error } = useProperties();

  const columns: Column<PropertyItem>[] = [
    { header: 'Title', accessorKey: 'title' },
    { header: 'Type', accessorKey: 'type' },
    {
      header: 'Price',
      cell: (item) => formatCurrency(item.price, item.currency),
    },
    {
      header: 'Status',
      cell: (item) => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold">
          {item.status}
        </span>
      ),
    },
    { header: 'City', accessorKey: 'city' },
  ];

  if (loading) return <div className="p-4 text-slate-500">Loading properties...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Properties Inventory</h1>
      </div>
      <Table columns={columns} data={properties} keyExtractor={(p) => p.id} />
    </div>
  );
};
