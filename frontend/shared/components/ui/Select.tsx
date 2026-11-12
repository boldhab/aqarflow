import React, { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, wrapperClassName, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
            {props.required && (
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${selectId}-help` : undefined}
            className={cn(
              'w-full px-3 py-2.5 sm:py-2 pr-8 border rounded-xl text-base sm:text-sm bg-white text-slate-900 appearance-none',
              'transition-colors duration-150 cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
              error
                ? 'border-red-400 focus-visible:ring-red-500'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-help`} className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p id={`${selectId}-help`} className="mt-1.5 text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
