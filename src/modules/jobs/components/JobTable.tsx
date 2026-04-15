import { useState }                     from 'react';
import { Activity, Download, AlertCircle,
         ChevronLeft, ChevronRight }     from 'lucide-react';
import { Checkbox }                     from '../../../components/ui/Checkbox';
import { JobStatusBadge }               from './JobStatusBadge';
import { JobProgressBar }               from './JobProgressBar';
import { JobErrorDialog }               from './JobErrorDialog';
import { JobBulkActionBar }             from './JobBulkActionBar';
import { Spinner }                      from '../../../components/ui/Spinner';
import { Select }                       from '../../../components/ui/Select';
import { cn }                           from '../../../utils';
import { formatLocalDateTime }          from '../../../utils';
import { useJobSearch }                 from '../hooks';
import { useJobStore }                  from '../store';
import type { JobResponse, JobSearchPayload } from '../../../services/job.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [
  { value: '10',  label: '10 / page'  },
  { value: '20',  label: '20 / page'  },
  { value: '50',  label: '50 / page'  },
  { value: '100', label: '100 / page' },
];

const JOB_TYPE_LABELS: Record<string, string> = {
  BULK_USER_ADD:        'Bulk User Add',
  BULK_CENTER_GRID_ADD: 'Bulk Centre Grid Add',
};

// ── Phase — compact pipeline cell ─────────────────────────────────────────────

function PhaseCell({ phase }: { phase: string }) {
  const steps = phase.split('~').filter(Boolean);
  if (steps.length === 0) return <span className="text-xs text-[var(--ink-light)]">—</span>;

  return (
    <div className="flex flex-wrap items-center gap-0.5 max-w-[180px]">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-[0.55rem] text-[var(--ink-light)]">›</span>}
          <span
            className={cn(
              'text-[0.6rem] font-mono font-semibold px-1 py-px rounded',
              i === steps.length - 1
                ? 'bg-[var(--ghost)] text-[var(--ink)] border border-[var(--border)]'
                : 'text-[var(--ink-light)]',
            )}
          >
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobTable({ flat = false }: { flat?: boolean }) {
  const {
    filters, pagination, liveTracking,
    setPage, setSize,
    selectedIds, toggleSelect, selectAll, clearSelection,
    openPolling,
  } = useJobStore();

  const [errorJob, setErrorJob] = useState<JobResponse | null>(null);

  const jobTypes = Array.isArray(filters.jobTypes) ? filters.jobTypes : [];
  const statuses = Array.isArray(filters.statuses) ? filters.statuses : [];

  const payload: JobSearchPayload = {
    page: pagination.page,
    size: pagination.size,
    ...(jobTypes.length > 0 && { jobTypes }),
    ...(statuses.length > 0 && { statuses }),
  };

  const { data, isLoading, isFetching } = useJobSearch(payload, liveTracking);

  const rows          = data?.content       ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages    = data?.totalPages    ?? 1;
  const displayPage   = pagination.page + 1;

  const allPageSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  function handleSelectAll() {
    allPageSelected ? clearSelection() : selectAll(rows.map((r) => r.id));
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  function PaginationBar() {
    const pages: (number | '…')[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - displayPage) <= 1) pages.push(p);
      else if (pages.at(-1) !== '…') pages.push('…');
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3
                      px-4 py-3 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--ink-light)]">
          {totalElements === 0
            ? '0 results'
            : `${pagination.page * pagination.size + 1}–${Math.min((pagination.page + 1) * pagination.size, totalElements)} of ${totalElements}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 0}
            className="w-7 h-7 flex items-center justify-center rounded-[8px]
                       text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="w-7 text-center text-xs text-[var(--ink-light)]">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage((p as number) - 1)}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-[8px] text-xs font-medium transition-colors',
                  p === displayPage
                    ? 'bg-[var(--sage-light)] text-[var(--sage)] font-semibold'
                    : 'text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
                )}
              >
                {p}
              </button>
            ),
          )}
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-[8px]
                       text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Bulk action bar — appears above table when rows are selected */}
        <JobBulkActionBar totalOnPage={rows.length} />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 pt-3 flex-wrap gap-2">
          <p className="text-xs text-[var(--ink-light)]">
            {isLoading ? 'Loading…' : `${totalElements} job${totalElements !== 1 ? 's' : ''}`}
            {isFetching && !isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#3B82F6]">
                <Spinner size="sm" /> refreshing
              </span>
            )}
          </p>
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pagination.size)}
            onChange={(v) => setSize(Number(v))}
            wrapClass="w-32"
            size="sm"
          />
        </div>

        {/* Table */}
        <div className={flat ? 'overflow-hidden' : 'bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-[var(--ghost)]">
                  <th className="w-10 px-3 py-2.5 border-b border-[var(--border)]">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={!allPageSelected && rows.some((r) => selectedIds.has(r.id))}
                      onChange={handleSelectAll}
                      aria-label="Select all on page"
                    />
                  </th>
                  {['Job Type', 'Status', 'Progress', 'Pipeline', 'Created', 'Updated', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 border-b border-[var(--border)] text-left
                                 text-[0.65rem] font-semibold uppercase tracking-[0.05em] text-[var(--ink-light)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div
                            className="h-3 rounded-md"
                            style={{
                              width: `${50 + (j % 4) * 15}%`,
                              background: `linear-gradient(90deg, var(--border) 25%, var(--ghost) 50%, var(--border) 75%)`,
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.6s infinite',
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <div className="w-12 h-12 rounded-[14px] bg-[var(--ghost)] border
                                        border-[var(--border)] flex items-center justify-center">
                          <Activity size={20} className="text-[var(--ink-light)]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--ink)]">No jobs found</p>
                          <p className="text-xs text-[var(--ink-light)] mt-1">
                            Bulk operations will appear here once triggered.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row: JobResponse) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-t border-[var(--border)] transition-colors',
                        selectedIds.has(row.id)
                          ? 'bg-[#EFF6FF] hover:bg-[#DBEAFE]'
                          : 'hover:bg-[var(--ghost)]',
                      )}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          aria-label={`Select job #${row.id}`}
                        />
                      </td>

                      {/* Job Type */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[var(--ink)]">
                          {JOB_TYPE_LABELS[row.jobType] ?? row.jobType}
                        </span>
                        <p className="text-[0.68rem] text-[var(--ink-light)] font-mono mt-0.5">
                          #{row.id}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <JobStatusBadge status={row.status} />
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <JobProgressBar
                          processedRows={row.processedRows}
                          totalRows={row.totalRows}
                          status={row.status}
                          showLabel
                        />
                      </td>

                      {/* Pipeline */}
                      <td className="px-4 py-3">
                        <PhaseCell phase={row.phase ?? ''} />
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-[var(--ink-light)]">
                          {row.createdAt ? formatLocalDateTime(row.createdAt) : '—'}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-[var(--ink-light)]">
                          {row.updatedAt ? formatLocalDateTime(row.updatedAt) : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Track active jobs */}
                          {(row.status === 'PROGRESS' || row.status === 'PENDING') && (
                            <button
                              onClick={() => openPolling(row.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px]
                                         text-xs font-medium text-[#1D4ED8] bg-[#EFF6FF]
                                         hover:bg-[#DBEAFE] transition-colors"
                            >
                              <Activity size={12} className="animate-pulse" />
                              Track
                            </button>
                          )}

                          {/* File download */}
                          {row.fileUrl && (
                            <a
                              href={row.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Download file"
                              className="p-1.5 rounded-[8px] text-[var(--sage)]
                                         hover:bg-[var(--sage-light)] transition-colors"
                            >
                              <Download size={13} />
                            </a>
                          )}

                          {/* Error details */}
                          {row.errorDetails && row.status === 'FAILED' && (
                            <button
                              onClick={() => setErrorJob(row)}
                              title="View errors"
                              className="p-1.5 rounded-[8px] text-[#DC2626]
                                         hover:bg-[#FEF2F2] transition-colors"
                            >
                              <AlertCircle size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalElements > 0 && <PaginationBar />}
        </div>
      </div>

      {/* Error dialog */}
      <JobErrorDialog job={errorJob} onClose={() => setErrorJob(null)} />
    </>
  );
}
