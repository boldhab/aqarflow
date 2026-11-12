'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { leadsApi } from '../api';
import { LeadItem, LeadStage } from '../types';
import {
  Table,
  Column,
  Button,
  Badge,
  BadgeVariant,
  Modal,
  Alert,
} from '@/shared/components/ui';
import { PageHeader } from '@/shared/components/layout';
import { formatDate } from '@/shared/lib';

const STAGES: { label: string; value: string }[] = [
  { label: 'All Stages', value: '' },
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Qualified', value: 'QUALIFIED' },
  { label: 'Visit Scheduled', value: 'VISIT_SCHEDULED' },
  { label: 'Negotiation', value: 'NEGOTIATION' },
  { label: 'Converted', value: 'CONVERTED' },
  { label: 'Lost', value: 'LOST' },
];

const ALL_PIPELINE_STAGES: LeadStage[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'NEGOTIATION',
  'CONVERTED',
  'LOST',
];

export const LeadList: React.FC = () => {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const params = useSearchParams();
  const router = useRouter();
  const viewMode = params.get('view') === 'pipeline' ? 'pipeline' : 'table';
  const setViewMode = (view: 'table' | 'pipeline') => { const next = new URLSearchParams(params.toString()); next.set('view', view); router.replace(`/leads?${next}`, { scroll: false }); };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await leadsApi.list(selectedStage ? { stage: selectedStage } : undefined);
      setLeads(res.data?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedStage]);

  const getStageBadgeVariant = (stage: LeadStage): BadgeVariant => {
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

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.property?.title && lead.property.title.toLowerCase().includes(q)) ||
      (lead.property?.referenceCode && lead.property.referenceCode.toLowerCase().includes(q))
    );
  });

  const columns: Column<LeadItem>[] = [
    {
      header: 'Client',
      cell: (lead) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">{lead.name}</div>
            {lead.email && <div className="text-xs text-slate-400 font-normal truncate">{lead.email}</div>}
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      cell: (lead) => (
        <div>
          <div className="font-mono text-xs font-semibold text-slate-800">{lead.phone}</div>
          {lead.preferredContact && (
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5">
              via {lead.preferredContact.toLowerCase()}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Linked Property',
      cell: (lead) => (
        <div>
          {lead.property ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-brand-50 text-brand-700 font-bold border border-brand-100 flex-shrink-0">
                {lead.property.referenceCode}
              </span>
              <span className="text-slate-800 font-medium text-xs truncate max-w-[200px]">
                {lead.property.title}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic text-xs">Direct Agency Inquiry</span>
          )}
        </div>
      ),
    },
    {
      header: 'Pipeline Stage',
      cell: (lead) => (
        <Badge variant={getStageBadgeVariant(lead.stage)} dot size="sm">
          {lead.stage.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: 'Received Date',
      cell: (lead) => (
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
          {formatDate(lead.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (lead) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => setSelectedLead(lead)}
        >
          Details
        </Button>
      ),
    },
  ];

  if (error) return <Alert variant="error" title="Unable to load leads"><p>The service is temporarily unavailable. Please try again.</p><Button variant="outline" className="mt-3" onClick={fetchLeads}>Retry</Button></Alert>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Leads &amp; Inquiries"
        subtitle="Manage prospective clients, viewing requests, communication channels, and conversion milestones."
        badge={
          !loading && (
            <Badge variant="default" size="md">
              {leads.length} Total
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pipeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'pipeline'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h17.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                Pipeline
              </button>
            </div>
          </div>
        }
      />

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search leads by name, phone, email, or property code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <label htmlFor="stage-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Stage:
          </label>
          <div className="relative">
            <select
              id="stage-filter"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-2 pr-8 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer shadow-sm font-medium"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main View: Table or Pipeline */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <Table
            columns={columns}
            data={filteredLeads}
            keyExtractor={(lead) => lead.id}
            isLoading={loading}
            skeletonRows={5}
            emptyMessage="No leads found"
            emptyDescription="Inquiries submitted via your public portal will automatically arrive here."
            emptyIcon={
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            }
            caption="Agency leads and inquiries"
          />
        </div>
      ) : (
        /* Pipeline Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {ALL_PIPELINE_STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage);
            return (
              <div
                key={stage}
                className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3 flex flex-col min-w-[220px]"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {stage.replace(/_/g, ' ')}
                  </span>
                  <Badge variant={getStageBadgeVariant(stage)} size="sm">
                    {stageLeads.length}
                  </Badge>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                  {stageLeads.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <button
                        type="button"
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-card hover:border-brand-300 transition-all cursor-pointer space-y-2 text-left w-full"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {lead.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(lead.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-mono">{lead.phone}</p>
                        {lead.property && (
                          <div className="text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-slate-700 truncate">
                            <span className="font-mono text-brand-600 font-bold mr-1">
                              {lead.property.referenceCode}
                            </span>
                            {lead.property.title}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standardized Detail Modal */}
      {selectedLead && (
        <Modal
          isOpen={Boolean(selectedLead)}
          onClose={() => setSelectedLead(null)}
          title="Lead Details"
          description={`Received on ${formatDate(selectedLead.createdAt)}`}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  Call Client
                </a>
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-200"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    Email
                  </a>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Client Name</span>
                <span className="font-bold text-slate-900">{selectedLead.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Mobile Phone</span>
                <span className="font-mono font-bold text-slate-900">{selectedLead.phone}</span>
              </div>
              {selectedLead.email && (
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Email</span>
                  <span className="text-slate-900 font-medium truncate block">{selectedLead.email}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Preferred Contact</span>
                <span className="capitalize text-slate-900 font-semibold">
                  {selectedLead.preferredContact?.toLowerCase() || 'Phone'}
                </span>
              </div>
            </div>

            {selectedLead.property && (
              <div className="border border-brand-100 bg-brand-50/50 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider block">
                  Linked Property
                </span>
                <div className="font-bold text-slate-900">{selectedLead.property.title}</div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                  <span className="font-mono font-bold text-brand-600">{selectedLead.property.referenceCode}</span>
                  {selectedLead.property.city && <span>• {selectedLead.property.city}</span>}
                  {selectedLead.property.price && (
                    <span>
                      • {selectedLead.property.currency || 'PKR'}{' '}
                      {Number(selectedLead.property.price).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {selectedLead.message && (
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Client Message
                </span>
                <p className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedLead.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span>Current Stage:</span>
                <Badge variant={getStageBadgeVariant(selectedLead.stage)} dot size="sm">
                  {selectedLead.stage.replace(/_/g, ' ')}
                </Badge>
              </div>
              {selectedLead.assignedAgent && (
                <span>
                  Assigned Agent: <strong className="text-slate-700">{selectedLead.assignedAgent.name}</strong>
                </span>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
