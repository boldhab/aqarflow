'use client';

import React, { useState, useEffect } from 'react';
import {
  PropertyItem,
  CreatePropertyPayload,
  PropertyPurpose,
  PropertyType,
  PropertyStatus,
  AreaUnit,
} from '../types';
import { propertiesApi } from '../api';
import { Button, Input } from '@/shared/components/ui';
import { useAuth } from '@/shared/hooks/useAuth';
import { apiClient } from '@/shared/lib';

export interface PropertyFormModalProps {
  property?: PropertyItem | null; // If null, create mode; otherwise edit mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedProperty: PropertyItem) => void;
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
    areaUnit: property?.areaUnit || 'SQFT',
    bedrooms: property?.bedrooms ?? null,
    bathrooms: property?.bathrooms ?? null,
    address: property?.address || '',
    city: property?.city || '',
    locality: property?.locality || '',
    latitude: property?.latitude ?? null,
    longitude: property?.longitude ?? null,
    assignedAgentId: property?.assignedAgentId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  if (!isOpen) return null;

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

    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload: CreatePropertyPayload = {
        ...formData,
        price: Number(formData.price),
        areaValue: Number(formData.areaValue),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {isEdit ? 'Edit Property' : 'Create New Property'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {generalError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Reference Code (optional)"
                placeholder="Auto-generated if blank (e.g. AF-0001)"
                value={formData.referenceCode || ''}
                onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value })}
                error={errors.referenceCode}
              />
            </div>
            <div>
              <Input
                label="Property Title *"
                placeholder="e.g. 3-Bed Apartment in Gulberg"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose *</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value as PropertyPurpose })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
                <option value="LEASE">For Lease</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PropertyType })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="PLOT">Plot</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="OFFICE">Office</option>
                <option value="SHOP">Shop</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PropertyStatus })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Price *"
                type="number"
                step="any"
                min="1"
                placeholder="Amount in PKR"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                error={errors.price}
                required
              />
            </div>
            <div>
              <Input
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Area Value *"
                type="number"
                step="any"
                min="0.1"
                placeholder="e.g. 2400 or 1"
                value={formData.areaValue || ''}
                onChange={(e) => setFormData({ ...formData, areaValue: parseFloat(e.target.value) || 0 })}
                error={errors.areaValue}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Area Unit *</label>
              <select
                value={formData.areaUnit}
                onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value as AreaUnit })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SQFT">Sq Ft</option>
                <option value="SQM">Sq M</option>
                <option value="MARLA">Marla</option>
                <option value="KANAL">Kanal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Bedrooms"
                type="number"
                min="0"
                placeholder="e.g. 3"
                value={formData.bedrooms ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bedrooms: e.target.value === '' ? null : parseInt(e.target.value, 10),
                  })
                }
                error={errors.bedrooms}
              />
            </div>
            <div>
              <Input
                label="Bathrooms"
                type="number"
                min="0"
                placeholder="e.g. 2"
                value={formData.bathrooms ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bathrooms: e.target.value === '' ? null : parseInt(e.target.value, 10),
                  })
                }
                error={errors.bathrooms}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="City"
                placeholder="e.g. Lahore, Karachi, Islamabad"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Locality / Sector"
                placeholder="e.g. DHA Phase 6, Gulberg III"
                value={formData.locality || ''}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Street Address"
                placeholder="e.g. 12-B Main Boulevard"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label htmlFor="assignedAgent" className="block text-sm font-medium text-slate-700 mb-1">
                Assigned Agent
              </label>
              <select
                id="assignedAgent"
                value={formData.assignedAgentId || ''}
                onChange={(e) => setFormData({ ...formData, assignedAgentId: e.target.value || null })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed property description, features, nearby amenities..."
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Property'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
