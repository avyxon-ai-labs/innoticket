import { Inbox, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Checkbox } from './Checkbox';
import { cn }       from '../../utils';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  /** Unique key — also used as sort key if sortable */
  key: string;
  label: string;
  sortable?: boolean;
  /** Pixel or % width hint */
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** Custom cell renderer. Falls back to (row as Record)[key] */
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  data:          T[];
  columns:       Column<T>[];
  /** Return a stable unique key per row */
  keyExtractor:  (row: T) => string;

  // Loading
  loading?:      boolean;
  skeletonRows?: number;

  // Empty state
  emptyTitle?:       string;
  emptyDescription?: string;
  emptyAction?:      React.ReactNode;

  // Sorting (controlled — parent manages state)
  sortKey?:  string;
  sortDir?:  'asc' | 'desc';
  onSort?:   (key: string, dir: 'asc' | 'desc') => void;

  // Pagination (controlled)
  page?:         number;
  pageSize?:     number;
  total?:        number;
  onPageChange?: (page: number) => void;

  // Row interaction
  onRowClick?: (row: T) => void;

  // Row selection — provide selectedKeys to enable checkbox column
  selectedKeys?:   Set<string>;
  onToggleSelect?: (key: string) => void;
  onSelectAll?:    (allKeys: string[]) => void;

  className?: string;
}

// ── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3.5 rounded-md"
            style={{
              width: `${60 + (i % 3) * 15}%`,
              background: `linear-gradient(90deg, var(--border) 25%, var(--ghost) 50%, var(--border) 75%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s infinite',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({
  colKey, sortKey, sortDir,
}: {
  colKey: string; sortKey?: string; sortDir?: 'asc' | 'desc';
}) {
  if (sortKey !== colKey)
    return <ChevronsUpDown size={13} className="text-[var(--border)]" />;
  return sortDir === 'asc'
    ? <ChevronUp   size={13} className="text-[var(--sage)]" />
    : <ChevronDown size={13} className="text-[var(--sage)]" />;
}

// ── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page, pageSize, total, onPageChange,
}: {
  page: number; pageSize: number; total: number; onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to   = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages.at(-1) !== '…') pages.push('…');
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)]">
      <span className="text-xs text-[var(--ink-light)]">
        {total === 0 ? '0 results' : `${from}–${to} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-[8px] text-[var(--ink-light)]',
            'hover:bg-[var(--ghost)] hover:text-[var(--ink)] transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
          )}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="w-7 text-center text-xs text-[var(--ink-light)]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-[8px] text-xs font-medium',
                'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
                p === page
                  ? 'bg-[var(--sage-light)] text-[var(--sage)] font-semibold'
                  : 'text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
              )}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-[8px] text-[var(--ink-light)]',
            'hover:bg-[var(--ghost)] hover:text-[var(--ink)] transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
          )}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your filters or search query.',
  emptyAction,
  sortKey,
  sortDir,
  onSort,
  page,
  pageSize = 20,
  total,
  onPageChange,
  onRowClick,
  selectedKeys,
  onToggleSelect,
  onSelectAll,
  className,
}: TableProps<T>) {

  const selectable = selectedKeys !== undefined && onToggleSelect !== undefined;

  const allPageKeys   = data.map(keyExtractor);
  const allSelected   = allPageKeys.length > 0 && allPageKeys.every((k) => selectedKeys?.has(k));
  const someSelected  = !allSelected && allPageKeys.some((k) => selectedKeys?.has(k));

  function handleSelectAll() {
    if (!onSelectAll || !onToggleSelect) return;
    if (allSelected) {
      // deselect all on page
      allPageKeys.forEach((k) => { if (selectedKeys?.has(k)) onToggleSelect(k); });
    } else {
      onSelectAll(allPageKeys);
    }
  }

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    const nextDir: 'asc' | 'desc' =
      sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(col.key, nextDir);
  };

  const showPagination =
    page !== undefined && total !== undefined && onPageChange && total > pageSize;

  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

  // Total column count including optional checkbox column
  const totalCols = columns.length + (selectable ? 1 : 0);

  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          {/* Head */}
          <thead>
            <tr className="bg-[var(--ghost)]">
              {/* Select-all checkbox */}
              {selectable && (
                <th className="w-10 px-3 py-2.5 border-b border-[var(--border)]">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all on page"
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col)}
                  className={cn(
                    'px-4 py-2.5 border-b border-[var(--border)]',
                    'text-[0.65rem] font-semibold uppercase tracking-[0.05em] text-[var(--ink-light)]',
                    alignClass[col.align ?? 'left'],
                    col.sortable && onSort
                      ? 'cursor-pointer select-none hover:text-[var(--ink)] transition-colors'
                      : '',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && onSort && (
                      <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonRow key={i} cols={totalCols} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={totalCols}>
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <div className="w-12 h-12 rounded-[14px] bg-[var(--ghost)] border border-[var(--border)] flex items-center justify-center">
                      <Inbox size={20} className="text-[var(--ink-light)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">{emptyTitle}</p>
                      <p className="text-xs text-[var(--ink-light)] mt-1">{emptyDescription}</p>
                    </div>
                    {emptyAction && <div>{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key       = keyExtractor(row);
                const isSelected = selectable && (selectedKeys?.has(key) ?? false);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-t border-[var(--border)] transition-colors duration-100',
                      isSelected
                        ? 'bg-[#EFF6FF] hover:bg-[#DBEAFE]'
                        : onRowClick
                          ? 'cursor-pointer hover:bg-[var(--ghost)]'
                          : 'hover:bg-[var(--ghost)]',
                    )}
                  >
                    {/* Per-row checkbox */}
                    {selectable && (
                      <td
                        className="w-10 px-3 py-3"
                        onClick={(e) => { e.stopPropagation(); onToggleSelect!(key); }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onToggleSelect!(key)}
                          aria-label="Select row"
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-sm text-[var(--ink-mid)]',
                          alignClass[col.align ?? 'left'],
                        )}
                      >
                        {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <Pagination
          page={page!}
          pageSize={pageSize}
          total={total!}
          onPageChange={onPageChange!}
        />
      )}
    </div>
  );
}
