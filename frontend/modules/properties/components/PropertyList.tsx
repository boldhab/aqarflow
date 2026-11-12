'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Column,
  Badge,
  BadgeVariant,
  Button,
  Pagination,
  Modal,
  Alert,
} from '@/shared/components/ui';
import { PageHeader } from '@/shared/components/layout';
import { formatPKR, formatCurrency } from '@/shared/lib';
import { PropertyItem } from '../types';
import { useProperties } from '../hooks';
import { useAuth } from '@/shared/hooks';
import { propertiesApi } from '../api';
import { PropertyFormModal } from './PropertyFormModal';
import { PropertyImageManager } from './PropertyImageManager';
import { useSearchParams, useRouter } from 'next/navigation';
import { PropertyImage } from '@/shared/components/ui/PropertyImage';

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

  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => { if (params.get('create') === '1') setFormModalOpen(true); }, [params]);
  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);
  const [imageManagerProperty, setImageManagerProperty] = useState<PropertyItem | null>(null);
  const [deleteConfirmProperty, setDeleteConfirmProperty] = useState<PropertyItem | null>(null);

  // Status/Publish action feedback
  const [manageProperty, setManageProperty] = useState<PropertyItem | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Search input state
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => { setSearchInput(filters.search || ''); }, [filters.search]);

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
      setManageProperty(current => current?.id === property.id ? { ...current, isPublished: !property.isPublished } : current);
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

  const formatPriceDisplay = (price: number | string, currency = 'PKR') => {
    if (currency === 'PKR') {
      return formatPKR(price);
    }
    return formatCurrency(price, currency);
  };

  const hasActiveFilters = Boolean(
    searchInput ||
      filters.status ||
      filters.purpose ||
      filters.type ||
      filters.city
  );

  const columns: Column<PropertyItem>[] = [
    {
      header: 'Property',
      className: 'max-w-[240px] whitespace-normal',
      cell: (item) => (
        <div className="flex items-center gap-3">
          {item.images && item.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <PropertyImage
              src={(item.images.find(image => image.isPrimary) || item.images[0]).url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
              <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21l6.75-6.75 1.5 1.5M21 3l-9 9M3.75 9h.008v.008H3.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 line-clamp-1 hover:text-brand-600 transition-colors">
              {item.title}
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="break-all font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-100">
                {item.referenceCode}
              </span>
              <span>•</span>
              <span className="capitalize">{item.type.toLowerCase().replace(/_/g, ' ')}</span>
              <span>•</span>
              <span className="capitalize font-medium text-slate-700">{item.purpose.toLowerCase()}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Asking Price',
      cell: (item) => (
        <div className="font-extrabold text-slate-900 whitespace-nowrap text-sm">
          {formatPriceDisplay(item.price, item.currency)}
        </div>
      ),
    },
    {
      header: 'Location',
      cell: (item) => (
        <div className="text-xs text-slate-600">
          <div className="font-medium text-slate-800">{item.city || '—'}</div>
          {item.locality && (
            <div className="text-slate-400 truncate max-w-[140px]">{item.locality}</div>
          )}
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
      header: 'Portal Live',
      cell: (item) => (
        <Badge variant={item.isPublished ? 'success' : 'default'} dot size="sm">
          {item.isPublished ? 'Published' : 'Unpublished'}
        </Badge>
      ),
    },
    {
      header: 'Assigned Agent',
      cell: (item) => (
        <span className="text-xs text-slate-600 whitespace-nowrap">
          {item.assignedAgent ? (
            <span className="font-medium text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-bold flex items-center justify-center">
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
      align: 'right',
      cell: (item) => {
        const canEdit = isAdmin || item.assignedAgentId === user?.id;
        const isActionLoading = actionLoadingId === item.id;

        return (
          <div className="flex flex-wrap items-center justify-end gap-2 max-w-[220px]">
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
                Photos ({item.images?.length || 0})
              </Button>
            )}

            {(canEdit || isAdmin) && <Button variant="ghost" size="xs" onClick={() => setManageProperty(item)} aria-label={`More actions for ${item.referenceCode}`}>More</Button>}

          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Properties Inventory"
        subtitle="Manage agency property inventory, live portal publishing, and assigned specialists."
        badge={
          !loading && (
            <Badge variant="default" size="md">
              {total} Total
            </Badge>
          )
        }
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingProperty(null);
              setFormModalOpen(true);
            }}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
          >
            Add Property
          </Button>
        }
      />

      {/* Action Error Alert */}
      {actionError && (
        <Alert variant="error" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="error" title="Failed to load properties">
          {error}
          <div className="mt-2">
            <Button variant="outline" size="xs" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-card space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              aria-label="Search inventory"
              placeholder="Search by title, reference code (e.g. AF-1001), locality..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm bg-white border-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
          {hasActiveFilters && (
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
            <div className="relative">
              <select
                aria-label="Filter inventory by status"
                value={filters.status || ''}
                onChange={(e) => updateFilters({ status: e.target.value || undefined })}
                className="w-full p-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
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
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Purpose Filter */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Purpose</label>
            <div className="relative">
              <select
                aria-label="Filter inventory by purpose"
                value={filters.purpose || ''}
                onChange={(e) => updateFilters({ purpose: e.target.value || undefined })}
                className="w-full p-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
              >
                <option value="">All Purposes</option>
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
                <option value="LEASE">For Lease</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Property Type</label>
            <div className="relative">
              <select
                aria-label="Filter inventory by property type"
                value={filters.type || ''}
                onChange={(e) => updateFilters({ type: e.target.value || undefined })}
                className="w-full p-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
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
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">City</label>
            <div className="relative">
              <select
                aria-label="Filter inventory by city"
                value={filters.city || ''}
                onChange={(e) => updateFilters({ city: e.target.value || undefined })}
                className="w-full p-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
              >
                <option value="">All Cities</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Islamabad">Islamabad</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!error && <div className="grid gap-4 lg:hidden" aria-label="Property inventory cards">
        {loading ? <p role="status" className="p-6">Loading inventory…</p> : properties.length === 0 ? <p className="p-6 rounded-2xl border bg-white">No matching properties. Adjust filters or add a property.</p> : properties.map(item => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-card">
          <div className="flex gap-3"><PropertyImage src={(item.images.find(image=>image.isPrimary)||item.images[0])?.url} alt={item.title} className="w-20 h-20 rounded-xl object-cover shrink-0"/><div className="min-w-0"><p className="text-xs text-slate-600">{item.referenceCode}</p><h2 className="font-semibold text-slate-900">{item.title}</h2><p className="text-lg font-bold text-brand-700 mt-1">{formatPriceDisplay(item.price,item.currency)}</p></div></div>
          <p className="text-sm text-slate-600">{[item.locality,item.city].filter(Boolean).join(', ') || 'Location not provided'}</p>
          <div className="flex flex-wrap gap-2"><Badge variant={getStatusBadgeVariant(item.status)}>{item.status.replace(/_/g,' ')}</Badge><Badge variant={item.isPublished?'success':'default'}>{item.isPublished?'Published':'Unpublished'}</Badge></div>
          <p className="text-sm text-slate-600">Agent: {item.assignedAgent?.name || 'Unassigned'}</p>
          <div className="flex flex-wrap gap-2">{columns[columns.length-1].cell?.(item)}</div>
        </article>)}
      </div>}
      {/* Main Standardized Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className={error ? "hidden" : "hidden lg:block"}>
        <Table
          columns={columns}
          data={properties}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          skeletonRows={6}
          emptyMessage="No properties found"
          emptyDescription="Try adjusting your search criteria or add your agency's first property listing."
          emptyIcon={
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
          }
          caption="Agency properties inventory"
        />

        </div>
        {/* Standardized Pagination */}
        {!error && !loading && total > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={20}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </div>

      {/* Create / Edit Form Modal */}
      {formModalOpen && (
        <PropertyFormModal
          property={editingProperty}
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingProperty(null);
            if (params.has('create')) router.replace('/inventory');
          }}
          onSuccess={(created) => {
            if (!editingProperty) setImageManagerProperty(created);
            refetch();
          }}
        />
      )}

      {/* Image Manager Modal */}
      {imageManagerProperty && (
        <Modal
          isOpen={Boolean(imageManagerProperty)}
          onClose={() => { if (!imageBusy) setImageManagerProperty(null); }}
          title={`Photos: ${imageManagerProperty.title}`}
          description={`Reference: ${imageManagerProperty.referenceCode} — upload photos or choose a cover image.`}
          size="lg"
        >
          <PropertyImageManager
            property={imageManagerProperty}
            onBusyChange={setImageBusy}
            onUpdate={(updated) => {
              setImageManagerProperty(updated);
              refetch();
            }}
            onClose={() => { if (!imageBusy) setImageManagerProperty(null); }}
          />
        </Modal>
      )}

      {manageProperty && <Modal isOpen onClose={() => { if (!actionLoadingId) setManageProperty(null); }} title="Manage listing" description={`${manageProperty.referenceCode} — ${manageProperty.title}`} size="sm">
        <div className="space-y-4"><p className="text-sm text-slate-600">Publication controls whether visitors can see this listing. Availability is managed separately in Edit.</p>{actionError && <Alert variant="error">{actionError}</Alert>}<Button isLoading={Boolean(actionLoadingId)} onClick={() => handlePublishToggle(manageProperty)}>{manageProperty.isPublished ? 'Unpublish listing' : 'Publish listing'}</Button>{isAdmin && <Button variant="danger" onClick={() => { setDeleteConfirmProperty(manageProperty);setManageProperty(null); }}>Archive</Button>}</div>
      </Modal>}

      {/* Admin Archive Confirmation Modal */}
      {deleteConfirmProperty && (
        <Modal
          isOpen={Boolean(deleteConfirmProperty)}
          onClose={() => !actionLoadingId && setDeleteConfirmProperty(null)}
          title="Archive Property"
          description="Are you sure you want to archive this property listing?"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="outline"
                size="sm"
                disabled={Boolean(actionLoadingId)}
                onClick={() => setDeleteConfirmProperty(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={Boolean(actionLoadingId)}
                onClick={handleDeleteConfirm}
              >
                Yes, Archive
              </Button>
            </div>
          }
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Property &quot;<span className="font-semibold text-slate-900">{deleteConfirmProperty.title}</span>&quot; (
            <span className="font-mono text-brand-600 font-bold">{deleteConfirmProperty.referenceCode}</span>) will be unpublished and hidden from both the workspace inventory and the public portal.
          </p>
        </Modal>
      )}
    </div>
  );
};
