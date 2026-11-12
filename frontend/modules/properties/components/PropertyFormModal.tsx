'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PropertyItem,
  CreatePropertyPayload,
  PropertyPurpose,
  PropertyType,
  PropertyStatus,
  AreaUnit,
} from '../types';
import { propertiesApi } from '../api';
import { Button, Input, Modal, Alert } from '@/shared/components/ui';
import { useAuth } from '@/shared/hooks/useAuth';
import { apiClient, formatPKR } from '@/shared/lib';

export interface PropertyFormModalProps {
  property?: PropertyItem | null; // If null, create mode; otherwise edit mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedProperty: PropertyItem) => void;
}

function formatPakistaniWords(amount: number): string {
  if (!amount || isNaN(amount)) return '';
  if (amount >= 10000000) {
    const crore = (amount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `${crore} Crore`;
  }
  if (amount >= 100000) {
    const lakh = (amount / 100000).toFixed(2).replace(/\.00$/, '');
    return `${lakh} Lakh`;
  }
  return '';
}

export const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(property);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isAdmin && isOpen) {
      apiClient<{ success: boolean; data: { id: string; name: string }[] }>('/users?role=AGENT')
        .then((res) => {
          if (res?.data) {
            setAgents(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isAdmin, isOpen]);

  const [formData, setFormData] = useState<CreatePropertyPayload>({
    referenceCode: property?.referenceCode || '',
    title: property?.title || '',
    description: property?.description || '',
    purpose: property?.purpose || 'SALE',
    type: property?.type || 'APARTMENT',
    status: property?.status || 'AVAILABLE',
    price: property ? Number(property.price) : 0,
    currency: property?.currency || 'PKR',
    areaValue: property ? Number(property.areaValue) : 0,
    areaUnit: property?.areaUnit || 'MARLA',
    bedrooms: property?.bedrooms ?? null,
    bathrooms: property?.bathrooms ?? null,
    address: property?.address || '',
    city: property?.city || '',
    locality: property?.locality || '',
    latitude: property?.latitude ?? null,
    longitude: property?.longitude ?? null,
    assignedAgentId: property?.assignedAgentId || '',
  });

  const initial = useRef(JSON.stringify(formData));
  const [confirmClose, setConfirmClose] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const requestClose = () => { if (submitting) return; if (JSON.stringify(formData) !== initial.current) setConfirmClose(true); else onClose(); };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters';
    }
    if (!formData.price || Number(formData.price) <= 0) {
      errs.price = 'Price must be greater than 0';
    }
    if (!formData.areaValue || Number(formData.areaValue) <= 0) {
      errs.areaValue = 'Area value must be greater than 0';
    }
    if (formData.bedrooms !== null && formData.bedrooms !== undefined && formData.bedrooms < 0) {
      errs.bedrooms = 'Bedrooms cannot be negative';
    }
    if (formData.bathrooms !== null && formData.bathrooms !== undefined && formData.bathrooms < 0) {
      errs.bathrooms = 'Bathrooms cannot be negative';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) { requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }

    try {
      setSubmitting(true);
      const payload: CreatePropertyPayload = {
        ...formData,
        price: Number(formData.price),
        areaValue: Number(formData.areaValue),
        bedrooms: formData.bedrooms == null ? null : Number(formData.bedrooms),
        bathrooms: formData.bathrooms == null ? null : Number(formData.bathrooms),
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        referenceCode: formData.referenceCode?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        locality: formData.locality?.trim() || undefined,
        assignedAgentId: formData.assignedAgentId ? formData.assignedAgentId : null,
      };

      let result: PropertyItem;
      if (isEdit && property) {
        const res = await propertiesApi.update(property.id, payload);
        result = res.data;
      } else {
        const res = await propertiesApi.create(payload);
        result = res.data;
      }

      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setGeneralError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const wordPreview = formatPakistaniWords(Number(formData.price));

  return (
    <Modal
      isOpen={isOpen}
      onClose={requestClose}
      title={isEdit ? 'Edit Property Listing' : 'Create New Property'}
      description={
        isEdit
          ? `Updating listing details for ref: ${property?.referenceCode || ''}`
          : 'Fill in the specifications below to create an agency property listing.'
      }
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="outline" size="sm" onClick={requestClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="property-form"
            variant="primary"
            size="sm"
            isLoading={submitting}
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Property'}
          </Button>
        </div>
      }
    >
      <form id="property-form" onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <Alert variant="error" onDismiss={() => setGeneralError(null)}>
            {generalError}
          </Alert>
        )}

        <h3 className="font-semibold text-brand-700 border-b pb-2">1. Listing basics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Reference Code"
            hint="Optional (auto-generated e.g. AF-1001 if left blank)"
            placeholder="e.g. AF-1001"
            value={formData.referenceCode || ''}
            onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value })}
            error={errors.referenceCode}
          />
          <Input
            label="Property Title"
            placeholder="e.g. 1 Kanal Modern Villa in DHA Phase 6"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="property-purpose" className="block text-sm font-medium text-slate-700 mb-1.5">
              Purpose <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="property-purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value as PropertyPurpose })}
                className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
              >
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
                <option value="LEASE">For Lease</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="property-type" className="block text-sm font-medium text-slate-700 mb-1.5">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="property-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PropertyType })}
                className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="PLOT">Plot</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="OFFICE">Office</option>
                <option value="SHOP">Shop</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="property-status" className="block text-sm font-medium text-slate-700 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="property-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PropertyStatus })}
                className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
              >
                <option value="DRAFT">Draft</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="UNDER_OFFER">Under Offer</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
                <option value="LEASED">Leased</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-brand-700 border-b pt-4 pb-2">2. Pricing and specifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Asking Price (PKR)"
              type="number"
              step="any"
              min="1"
              placeholder="e.g. 35000000"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              error={errors.price}
              hint={
                formData.price && Number(formData.price) > 0
                  ? `${formatPKR(formData.price)}${wordPreview ? ` (${wordPreview})` : ''}`
                  : 'Enter price in PKR'
              }
              required
            />
          </div>
          <div>
            <Input
              label="Currency"
              value={formData.currency}
              disabled
              hint="Fixed to Pakistani Rupee (PKR)"
            />
          </div>
        </div>

        {/* Area Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Area Value"
              type="number"
              step="any"
              min="0.1"
              placeholder="e.g. 10 or 2500"
              value={formData.areaValue || ''}
              onChange={(e) => setFormData({ ...formData, areaValue: parseFloat(e.target.value) || 0 })}
              error={errors.areaValue}
              required
            />
          </div>
          <div>
            <label htmlFor="property-areaUnit" className="block text-sm font-medium text-slate-700 mb-1.5">
              Area Unit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="property-areaUnit"
                value={formData.areaUnit}
                onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value as AreaUnit })}
                className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
              >
                <option value="MARLA">Marla (225 sq ft)</option>
                <option value="KANAL">Kanal (20 Marla)</option>
                <option value="SQFT">Square Feet (Sq Ft)</option>
                <option value="SQM">Square Meters (Sq M)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Bedrooms"
            type="number"
            min="0"
            placeholder="e.g. 4"
            value={formData.bedrooms ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                bedrooms: e.target.value === '' ? null : parseInt(e.target.value, 10),
              })
            }
            error={errors.bedrooms}
            hint="Leave blank for plots or commercial spaces"
          />
          <Input
            label="Bathrooms"
            type="number"
            min="0"
            placeholder="e.g. 4"
            value={formData.bathrooms ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                bathrooms: e.target.value === '' ? null : parseInt(e.target.value, 10),
              })
            }
            error={errors.bathrooms}
            hint="Leave blank if not applicable"
          />
        </div>

        <h3 className="font-semibold text-brand-700 border-b pt-4 pb-2">3. Location and description</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City"
            placeholder="e.g. Lahore, Karachi, Islamabad"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label="Locality / Sector"
            placeholder="e.g. DHA Phase 6, Gulberg III"
            value={formData.locality || ''}
            onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
          />
          <Input
            label="Street Address"
            placeholder="e.g. 12-B Main Boulevard"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        {isAdmin && (
          <div>
            <label htmlFor="assignedAgent" className="block text-sm font-medium text-slate-700 mb-1.5">
              Assigned Specialist
            </label>
            <div className="relative">
              <select
                id="assignedAgent"
                value={formData.assignedAgentId || ''}
                onChange={(e) => setFormData({ ...formData, assignedAgentId: e.target.value || null })}
                className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
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
        )}

        <div>
          <label htmlFor="property-description" className="block text-sm font-medium text-slate-700 mb-1.5">
            Detailed Description
          </label>
          <textarea
            id="property-description"
            rows={3}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Highlight architecture, fittings, parking, nearby schools, parks, and amenities..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 resize-none"
          />
        </div>
      </form>
      {confirmClose && <Modal isOpen onClose={()=>setConfirmClose(false)} title="Discard unsaved changes?" size="sm" footer={<><Button variant="outline" onClick={()=>setConfirmClose(false)}>Keep editing</Button><Button variant="danger" onClick={onClose}>Discard</Button></>}><p className="text-sm text-slate-600">Your property details have not been saved.</p></Modal>}
    </Modal>
  );
};
