'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDialogFocus } from '@/shared/hooks/useDialogFocus';
import { PropertyImage } from '@/shared/components/ui/PropertyImage';
import { PublicPropertyImage } from '../types';

const API_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_SERVER_URL}${url}`;
}

export interface PropertyGalleryProps {
  title: string;
  images: PublicPropertyImage[];
}

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({ title, images }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useDialogFocus(dialogRef, isLightboxOpen);

  const prevImage = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);


    return () => {
      document.removeEventListener('keydown', handleKeyDown);

    };
  }, [isLightboxOpen, prevImage, nextImage]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-72 sm:h-96 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-200">
        <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21l6.75-6.75 1.5 1.5M21 3l-9 9M3.75 9h.008v.008H3.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="text-sm">No images available for this property</p>
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];
  const currentUrl = resolveImageUrl(currentImage?.url);

  return (
    <div className="space-y-3">
      {/* Main View */}
      <div className="relative h-72 sm:h-96 md:h-[460px] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-card group">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <PropertyImage
            src={currentUrl}
            alt={currentImage.caption || title}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
            onClick={() => setIsLightboxOpen(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            Image unavailable
          </div>
        )}

        {/* Caption */}
        {currentImage.caption && (
          <div className="absolute bottom-3 left-3 right-16 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg max-w-max truncate">
            {currentImage.caption}
          </div>
        )}

        {/* Counter Badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Expand / Fullscreen Button */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-3 left-3 p-2 min-h-[36px] min-w-[36px] flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          aria-label="Open fullscreen gallery"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-black/50 hover:bg-black/75 text-white rounded-full backdrop-blur-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              aria-label="Previous image"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-black/50 hover:bg-black/75 text-white rounded-full backdrop-blur-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              aria-label="Next image"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin" role="list" aria-label="Image thumbnails">
          {images.map((img, idx) => {
            const thumbUrl = resolveImageUrl(img.url);
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"

                onClick={() => setSelectedIndex(idx)}
                className={`relative flex-shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-brand-600 ring-2 ring-brand-500/30 shadow-sm scale-[1.02]'
                    : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                }`}
                aria-label={`View image ${idx + 1}`}
                aria-pressed={isSelected}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <PropertyImage src={thumbUrl} alt="" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fade-in"
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded gallery view"
        >
          {/* Top Controls */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white z-10">
            <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              {selectedIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close fullscreen gallery"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lightbox Main Image */}
          <div className="relative max-w-5xl max-h-[80vh] w-full h-full flex items-center justify-center">
            {currentUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <PropertyImage
                src={currentUrl}
                alt={currentImage.caption || title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="text-white text-sm">Image unavailable</div>
            )}

            {/* Lightbox Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors"
                  aria-label="Previous image"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors"
                  aria-label="Next image"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Lightbox Caption */}
          {currentImage.caption && (
            <p className="mt-4 text-sm text-slate-300 text-center max-w-xl">
              {currentImage.caption}
            </p>
          )}

          {/* Lightbox Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-4 flex gap-2 max-w-full overflow-x-auto px-4 py-2 scrollbar-thin">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  aria-label={`View image ${idx + 1}`}
                  aria-pressed={idx === selectedIndex}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    idx === selectedIndex ? 'border-brand-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <PropertyImage src={resolveImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
