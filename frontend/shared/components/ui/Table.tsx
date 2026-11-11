import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  skeletonRows?: number;
  onRowClick?: (item: T) => void;
  caption?: string;
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div
                className="h-4 bg-slate-200 rounded animate-pulse"
                style={{ width: `${60 + (rowIdx * 13 + colIdx * 7) % 30}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  className,
  isLoading = false,
  emptyMessage = 'No records found',
  emptyDescription,
  emptyIcon,
  skeletonRows = 5,
  onRowClick,
  caption,
}: TableProps<T>) {
  const alignClass = (align?: string) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-slate-200 bg-white', className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead>
          <tr className="bg-slate-50">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={cn(
                  'px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200',
                  alignClass(col.align),
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <TableSkeleton rows={skeletonRows} cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  {emptyIcon && (
                    <div className="mb-3 text-slate-300">{emptyIcon}</div>
                  )}
                  <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
                  {emptyDescription && (
                    <p className="mt-1 text-xs text-slate-400 max-w-sm">{emptyDescription}</p>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  'transition-colors duration-100',
                  onRowClick
                    ? 'cursor-pointer hover:bg-brand-50/50'
                    : 'hover:bg-slate-50/75'
                )}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'px-4 py-3 text-slate-700 whitespace-nowrap',
                      alignClass(col.align),
                      col.className
                    )}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? '')
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
