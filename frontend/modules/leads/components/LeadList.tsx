'use client';

import React, { useState, useEffect } from 'react';
import { leadsApi } from '../api';
import { LeadItem, LeadStage } from '../types';
import { Button, Badge, BadgeVariant } from '@/shared/components/ui';

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

export const LeadList: React.FC = () => {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads &amp; Inquiries</h1>
            {!loading && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {leads.length}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage inquiries and prospective clients received from your public property listings
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="stage-filter" className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
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
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-brand-600" />
            <p className="text-sm font-medium">Loading leads pipeline...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-base font-semibold text-slate-800">No leads found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When public visitors submit an inquiry on any of your properties, their details will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Linked Property</th>
                  <th className="px-6 py-3.5">Pipeline Stage</th>
                  <th className="px-6 py-3.5">Received Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{lead.name}</div>
                          {lead.email && <div className="text-xs text-slate-400 font-normal">{lead.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-800">{lead.phone}</div>
                      {lead.preferredContact && (
                        <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 mt-0.5">
                          via {lead.preferredContact.toLowerCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.property ? (
                        <div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-brand-50 text-brand-700 font-bold mr-1.5 border border-brand-100">
                            {lead.property.referenceCode}
                          </span>
                          <span className="text-slate-800 font-medium text-xs truncate max-w-[200px] inline-block align-middle">
                            {lead.property.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Direct Agency Inquiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStageBadgeVariant(lead.stage)} dot size="sm">
                        {lead.stage.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedLead(lead)}
                        className="font-semibold"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full p-6 space-y-5 animate-slide-up">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Lead Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Received on {formatDate(selectedLead.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
                aria-label="Close lead details"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 block">Client Name</span>
                  <span className="font-bold text-slate-900">{selectedLead.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Mobile Phone</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLead.phone}</span>
                </div>
                {selectedLead.email && (
                  <div>
                    <span className="text-xs text-slate-500 block">Email</span>
                    <span className="text-slate-900 font-medium truncate block">{selectedLead.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-500 block">Preferred Contact</span>
                  <span className="capitalize text-slate-900 font-semibold">
                    {selectedLead.preferredContact?.toLowerCase() || 'Phone'}
                  </span>
                </div>
              </div>

              {selectedLead.property && (
                <div className="border border-brand-100 bg-brand-50/40 p-4 rounded-xl space-y-1">
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
                    {selectedLead.stage.replace('_', ' ')}
                  </Badge>
                </div>
                {selectedLead.assignedAgent && (
                  <span>
                    Agent: <strong className="text-slate-700">{selectedLead.assignedAgent.name}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
