'use client';

import React from 'react';
import { PropertyList } from '@/modules/properties';
import { PublicListings } from '@/modules/public-portal';
import { useAuth } from '@/shared/hooks';

export default function PropertiesPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading properties...</div>;
  }

  // If user is logged into workspace, show inventory management; otherwise show public listings
  return isAuthenticated ? <PropertyList /> : <PublicListings />;
}
