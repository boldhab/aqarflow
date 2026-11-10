'use client';

import React from 'react';
import { useLeads } from '../hooks';
import { LeadStage } from '../types';

const STAGES: LeadStage[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'NEGOTIATION',
  'CONVERTED',
  'LOST',
];

export const LeadPipeline: React.FC = () => {
  const { leads, loading, error } = useLeads();

  if (loading) return <div className="p-4 text-slate-500">Loading lead pipeline...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Lead Pipeline</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-w-[200px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                <span className="text-xs font-bold text-slate-700">{stage}</span>
                <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full font-semibold">
                  {stageLeads.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 bg-white border border-slate-200 rounded-md shadow-sm text-sm"
                  >
                    <p className="font-semibold text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.phone}</p>
                    {lead.assignedTo && (
                      <p className="text-[11px] text-blue-600 mt-1">
                        Agent: {lead.assignedTo.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
