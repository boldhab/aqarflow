import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rect',
  width,
  height,
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 rounded',
        variant === 'circle' && 'rounded-full',
        variant === 'line' && 'rounded h-4',
        className
      )}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-2/5" />
    </div>
  </div>
);

export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 p-5 space-y-3', className)}>
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-7 w-1/3" />
  </div>
);
