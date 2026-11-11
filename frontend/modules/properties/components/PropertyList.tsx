'use client';

import React, { useState } from 'react';
import { Column, Badge, BadgeVariant, Button } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/lib';
import { PropertyItem } from '../types';
import { useProperties } from '../hooks';
import { useAuth } from '@/shared/hooks';
import { propertiesApi } from '../api';
import { PropertyFormModal } from './PropertyFormModal';
import { PropertyImageManager } from './PropertyImageManager';

export const PropertyList: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const {
    properties,
    total,
    totalPages,
    page,
    setPage,
    filters,
    updateFilters,
    clearFilters,
    loading,
    error,
    refetch,
  } = useProperties();

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);
  const [imageManagerProperty, setImageManagerProperty] = useState<PropertyItem | null>(null);
  const [deleteConfirmProperty, setDeleteConfirmProperty] = useState<PropertyItem | null>(null);

  // Status/Publish action feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Search input state
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() || undefined });
  };

  const handlePublishToggle = async (property: PropertyItem) => {
    setActionError(null);
    setActionLoadingId(property.id);
    try {
      if (property.isPublished) {
        await propertiesApi.unpublish(property.id);
      } else {
        await propertiesApi.publish(property.id);
      }
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publish action failed';
      setActionError(`Property ${property.referenceCode}: ${msg}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmProperty) return;
    setActionError(null);
    setActionLoadingId(deleteConfirmProperty.id);
    try {
      await propertiesApi.delete(deleteConfirmProperty.id);
      setDeleteConfirmProperty(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to archive property';
      setActionError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'RESERVED':
        return 'warning';
      case 'UNDER_OFFER':
        return 'purple';
      case 'SOLD':
        return 'primary';
      case 'RENTED':
      case 'LEASED':
        return 'indigo';
      case 'DRAFT':
        return 'default';
      case 'INACTIVE':
      default:
        return 'danger';
    }
  };

  const columns: Column<PropertyItem>[] = [
    {
      header: 'Property',
      cell: (item) => (
        <div className="flex items-center space-x-3">
          {item.images && item.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.images[0].url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
              No Img
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-900 line-clamp-1">{item.title}</div>
            <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
              <span className="font-mono font-bold text-brand-600">{item.referenceCode}</span>
              <span>•</span>
              <span className="capitalize">{item.type.toLowerCase()}</span>
              <span>•</span>
              <span className="capitalize">{item.purpose.toLowerCase()}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      cell: (item) => (
        <div className="font-bold text-slate-900 whitespace-nowrap font-mono text-sm">
          {formatCurrency(item.price, item.currency)}
        </div>
      ),
    },
    {
      header: 'Location',
      cell: (item) => (
        <div className="text-xs text-slate-600">
          <div className="font-medium text-slate-800">{item.city || '—'}</div>
          {item.locality && <div className="text-slate-400 truncate max-w-[140px]">{item.locality}</div>}
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
      header: 'Listing Status',
      cell: (item) => (
        <Badge variant={item.isPublished ? 'success' : 'default'} dot size="sm">
          {item.isPublished ? 'Live' : 'Draft'}
        </Badge>
      ),
    },
    {
      header: 'Assigned Agent',
      cell: (item) => (
        <span className="text-xs text-slate-600 whitespace-nowrap">
          {item.assignedAgent ? (
            <span className="font-medium text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                {item.assignedAgent.name.charAt(0).toUpperCase()}
              </span>
              {item.assignedAgent.name}
            </span>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => {
        const canEdit = isAdmin || item.assignedAgentId === user?.id;
        const isActionLoading = actionLoadingId === item.id;

        return (
          <div className="flex items-center space-x-1.5">
            {canEdit && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setEditingProperty(item);
                  setFormModalOpen(true);
                }}
              >
                Edit
              </Button>
            )}

            {canEdit && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setImageManagerProperty(item)}
              >
                Images ({item.images?.length || 0})
              </Button>
            )}

            {canEdit && (
              <Button
                variant={item.isPublished ? 'outline' : 'primary'}
                size="xs"
                disabled={isActionLoading}
                onClick={() => handlePublishToggle(item)}
              >
                {isActionLoading ? '...' : item.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="danger"
                size="xs"
                onClick={() => setDeleteConfirmProperty(item)}
              >
                Archive
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Properties Inventory</h1>
            {!loading && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {total}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage agency property listings, pricing, and availability
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingProperty(null);
            setFormModalOpen(true);
          }}
          className="w-full sm:w-auto font-bold shadow-sm"
        >
          + Add Property
        </Button>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span className="font-medium">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-card space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by title, reference code (e.g. AF-1001), address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm bg-white border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="font-semibold">
            Search
          </Button>
          {(searchInput || Object.keys(filters).length > 0) && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setSearchInput('');
                clearFilters();
              }}
            >
              Reset
            </Button>
          )}
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilters({ status: e.target.value || undefined })}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <option value="">All Statuses</option>
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

          {/* Purpose Filter */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Purpose</label>
            <select
              value={filters.purpose || ''}
              onChange={(e) => updateFilters({ purpose: e.target.value || undefined })}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <option value="">All Purposes</option>
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
              <option value="LEASE">For Lease</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Property Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => updateFilters({ type: e.target.value || undefined })}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <option value="">All Types</option>
              <option value="APARTMENT">Apartment</option>
              <option value="HOUSE">House</option>
              <option value="VILLA">Villa</option>
              <option value="PLOT">Plot</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="OFFICE">Office</option>
              <option value="SHOP">Shop</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">City</label>
            <select
              value={filters.city || ''}
              onChange={(e) => updateFilters({ city: e.target.value || undefined })}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <option value="">All Cities</option>
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table or Loading / Error State */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-card space-y-3">
          <div className="inline-block animate-spin h-8 w-8 border-2 border-slate-200 border-t-brand-600 rounded-full" />
          <p className="text-sm font-medium">Loading properties inventory...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-red-600 bg-red-50 border border-red-200 rounded-2xl text-center">
          <p className="font-semibold text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : properties.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-card">
          <div className="text-4xl mb-3">🏡</div>
          <p className="text-base font-semibold text-slate-800">No properties found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add your agency&apos;s first property listing.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingProperty(null);
              setFormModalOpen(true);
            }}
            className="mt-4"
          >
            Create First Property
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-5 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs border-b border-slate-200"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                    {columns.map((col, idx) => (
                      <td key={idx} className="px-5 py-3.5 text-slate-700">
                        {col.cell ? col.cell(item) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50">
            <div>
              Showing <span className="font-semibold text-slate-900">{properties.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{total}</span> total properties
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-slate-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="xs"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {formModalOpen && (
        <PropertyFormModal
          property={editingProperty}
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingProperty(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Image Manager Modal */}
      {imageManagerProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <PropertyImageManager
              property={imageManagerProperty}
              onUpdate={(updated) => {
                setImageManagerProperty(updated);
                refetch();
              }}
              onClose={() => setImageManagerProperty(null)}
            />
          </div>
        </div>
      )}

      {/* Admin Archive Confirmation Modal */}
      {deleteConfirmProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal max-w-md w-full p-6 animate-slide-up space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Archive Property</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to archive property &quot;
                <span className="font-semibold text-slate-900">{deleteConfirmProperty.title}</span>&quot; (
                {deleteConfirmProperty.referenceCode})? It will be hidden from the workspace inventory and public portal.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmProperty(null)}
                disabled={Boolean(actionLoadingId)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={Boolean(actionLoadingId)}
              >
                {actionLoadingId ? 'Archiving...' : 'Yes, Archive'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
