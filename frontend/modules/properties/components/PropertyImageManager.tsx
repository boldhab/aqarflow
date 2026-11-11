'use client';

import React, { useState, useRef } from 'react';
import { PropertyItem, PropertyImage } from '../types';
import { propertiesApi } from '../api';
import { Button } from '@/shared/components/ui';

export interface PropertyImageManagerProps {
  property: PropertyItem;
  onUpdate: (updatedProperty: PropertyItem) => void;
  onClose: () => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_IMAGES = 15;

export const PropertyImageManager: React.FC<PropertyImageManagerProps> = ({
  property,
  onUpdate,
  onClose,
}) => {
  const [images, setImages] = useState<PropertyImage[]>(property.images || []);
  const [uploading, setUploading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList);

    if (images.length + files.length > MAX_TOTAL_IMAGES) {
      setError(`Cannot exceed ${MAX_TOTAL_IMAGES} images. Current: ${images.length}, Attempted: ${files.length}`);
      return;
    }

    if (files.length > 10) {
      setError('You can upload at most 10 files at once.');
      return;
    }

    // Validate size and mime type
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a valid format. Only JPEG, PNG, and WebP are supported.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 5MB size limit.`);
        return;
      }
    }

    try {
      setUploading(true);
      const res = await propertiesApi.uploadImages(property.id, files);
      setImages(res.data.images || []);
      onUpdate(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      setActionLoadingId(imageId);
      setError(null);
      const res = await propertiesApi.setPrimaryImage(property.id, imageId);
      setImages(res.data.images || []);
      onUpdate(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set primary image';
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      setActionLoadingId(imageId);
      setError(null);
      const res = await propertiesApi.deleteImage(property.id, imageId);
      setImages(res.data.images || []);
      onUpdate(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete image';
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">
            Manage Images for &quot;{property.title}&quot;
          </h4>
          <p className="text-xs text-slate-500">
            {images.length} of {MAX_TOTAL_IMAGES} images uploaded (JPEG, PNG, WebP up to 5MB each)
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
          Ref: {property.referenceCode}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Drag & Drop Upload Area */}
      {images.length < MAX_TOTAL_IMAGES && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-brand-500 bg-brand-50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex items-center justify-center space-x-2 text-sm text-brand-600 font-medium">
              <svg className="animate-spin h-5 w-5 text-brand-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Uploading images...</span>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-700">
                Click to upload or drag and drop images here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Up to 10 files at once, max 5MB each
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Grid */}
      {images.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400 border border-slate-100 rounded-lg">
          No images uploaded yet. Upload at least one image before publishing.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
          {images.map((img) => {
            const isLoading = actionLoadingId === img.id;
            return (
              <div
                key={img.id}
                className={`relative group rounded-lg overflow-hidden border ${
                  img.isPrimary ? 'border-amber-400 ring-2 ring-amber-300' : 'border-slate-200'
                } bg-slate-100 flex flex-col`}
              >
                {/* Image Preview */}
                <div className="relative h-28 w-full bg-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption || 'Property image'}
                    className="w-full h-full object-cover"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      ★ PRIMARY
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="p-2 flex items-center justify-between bg-white text-xs">
                  {!img.isPrimary ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSetPrimary(img.id)}
                      className="text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50"
                    >
                      {isLoading ? '...' : 'Set Primary'}
                    </button>
                  ) : (
                    <span className="text-amber-600 font-medium">Main Image</span>
                  )}

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDelete(img.id)}
                    className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    {isLoading ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
};
