'use client';

import React, { useState } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-80 sm:h-96 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
        No images available for this property
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];
  const currentUrl = resolveImageUrl(currentImage?.url);

  return (
    <div className="space-y-3">
      {/* Main View */}
      <div className="relative h-72 sm:h-96 md:h-[460px] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-md">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={currentImage.caption || title}
            className="w-full h-full object-cover transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            Image unavailable
          </div>
        )}

        {currentImage.caption && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg max-w-max">
            {currentImage.caption}
          </div>
        )}

        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => {
            const thumbUrl = resolveImageUrl(img.url);
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative flex-shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border-2 transition ${
                  isSelected ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
