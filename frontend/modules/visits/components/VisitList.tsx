'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
import { formatAppointment } from '@/shared/lib';
import { VisitItem } from '../types';
import { useVisits } from '../hooks';

export const VisitList: React.FC = () => {
  const { visits, loading, error, refetch } = useVisits();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedVisit, setSelectedVisit] = useState<VisitItem | null>(null);

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
      header: 'Client / Lead',
      cell: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {item.lead.name ? item.lead.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">{item.lead.name}</span>
            <a
              href={`tel:${item.lead.phone}`}
              className="text-xs text-slate-500 font-mono hover:text-brand-600 transition-colors"
            >
              {item.lead.phone}
            </a>
          </div>
        </div>
      ),
    },
    {
      header: 'Scheduled Date & Time',
      cell: (item) => (
        <div className="text-xs text-slate-700 whitespace-nowrap">
          <span className="font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-slate-200/60 font-medium">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatAppointment(item.scheduledAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <Badge variant={getStatusBadgeVariant(item.status)} dot size="sm">
          {item.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: 'Assigned Agent',
      cell: (item) => (
        <div className="text-xs text-slate-600 whitespace-nowrap">
          {item.agent?.name ? (
            <span className="font-medium text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-bold flex items-center justify-center">
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
    {
      header: 'Actions',
      align: 'right',
      cell: (item) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => setSelectedVisit(item)}
        >
          View
        </Button>
      ),
    },
  ];

  if (error) return <Alert variant="error" title="Unable to load visits"><p>The service is temporarily unavailable. Please try again.</p><Button variant="outline" className="mt-3" onClick={refetch}>Retry</Button></Alert>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Scheduled Visits"
        subtitle="Manage client property inspections, showing appointments, and feedback logs."
        badge={
          !loading && (
            <Badge variant="default" size="md">
              {visits.length} Total
            </Badge>
          )
        }
        actions={
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold border border-slate-200/80">
            {[
              { label: 'All Visits', value: 'ALL' },
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
        }
      />

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Main Standardized Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={filteredVisits}
          keyExtractor={(v) => v.id}
          isLoading={loading}
          skeletonRows={5}
          emptyMessage="No scheduled visits found"
          emptyDescription="When prospective buyers request viewings, appointments will appear here."
          emptyIcon={
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
          }
          caption="Scheduled property visits"
        />
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <Modal
          isOpen={Boolean(selectedVisit)}
          onClose={() => setSelectedVisit(null)}
          title="Visit Details"
          description={`Scheduled inspection for ${selectedVisit.property.title}`}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <a
                href={`tel:${selectedVisit.lead.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Call {selectedVisit.lead.name}
              </a>
              <Button variant="secondary" size="sm" onClick={() => setSelectedVisit(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Client</span>
                <span className="font-bold text-slate-900">{selectedVisit.lead.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Phone</span>
                <span className="font-mono font-bold text-slate-900">{selectedVisit.lead.phone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Date &amp; Time</span>
                <span className="font-medium text-slate-900 font-mono text-xs">
                  {formatAppointment(selectedVisit.scheduledAt)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Visit Status</span>
                <Badge variant={getStatusBadgeVariant(selectedVisit.status)} dot size="sm">
                  {selectedVisit.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>

            <div className="border border-brand-100 bg-brand-50/50 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider block">
                Target Property
              </span>
              <div className="font-bold text-slate-900">{selectedVisit.property.title}</div>
            </div>

            {selectedVisit.notes && (
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Visit Notes
                </span>
                <p className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedVisit.notes}
                </p>
              </div>
            )}

            {selectedVisit.agent && (
              <div className="pt-2 text-xs text-slate-500">
                Assigned Specialist: <strong className="text-slate-800">{selectedVisit.agent.name}</strong>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
