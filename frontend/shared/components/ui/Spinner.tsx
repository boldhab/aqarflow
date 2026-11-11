import React from 'react';
import { cn } from '../../lib/utils';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label = 'Loading...' }) => {
  const sizes = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
  };

  return (
    <div className={cn('flex items-center gap-2', className)} role="status">
      <div
        className={cn(
          'animate-spin rounded-full border-slate-200 border-t-brand-600',
          sizes[size]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export const PageSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
    <Spinner size="lg" />
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);
