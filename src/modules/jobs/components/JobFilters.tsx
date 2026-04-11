import { X, Radio }        from 'lucide-react';
import { MultiSelect }     from '../../../components/ui/MultiSelect';
import { Button }          from '../../../components/ui/Button';
import { cn }              from '../../../utils';
import { useJobStore }     from '../store';
import type { JobType, JobStatus } from '../../../services/job.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const JOB_TYPE_OPTIONS: JobType[] = ['BULK_USER_ADD', 'BULK_CENTER_GRID_ADD'];

const JOB_TYPE_LABELS: Record<JobType, string> = {
  BULK_USER_ADD:        'Bulk User Add',
  BULK_CENTER_GRID_ADD: 'Bulk Centre Grid Add',
};

const STATUS_OPTIONS: JobStatus[] = ['PENDING', 'PROGRESS', 'COMPLETED', 'FAILED'];

const STATUS_LABELS: Record<JobStatus, string> = {
  PENDING:   'Pending',
  PROGRESS:  'In Progress',
  COMPLETED: 'Completed',
  FAILED:    'Failed',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function JobFilters() {
  const {
    filters, setJobTypes, setStatuses, clearFilters,
    liveTracking, toggleLive,
  } = useJobStore();

  const jobTypes = Array.isArray(filters.jobTypes) ? filters.jobTypes : [];
  const statuses = Array.isArray(filters.statuses) ? filters.statuses : [];

  const hasActive = jobTypes.length > 0 || statuses.length > 0;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-3">
      {/* Job Type multi-select */}
      <MultiSelect
        placeholder="All job types"
        options={JOB_TYPE_OPTIONS.map((t) => JOB_TYPE_LABELS[t])}
        value={jobTypes.map((t) => JOB_TYPE_LABELS[t])}
        onChange={(labels) =>
          setJobTypes(
            labels.map(
              (l) => JOB_TYPE_OPTIONS.find((t) => JOB_TYPE_LABELS[t] === l)!,
            ),
          )
        }
        wrapClass="w-full sm:w-52"
      />

      {/* Status multi-select */}
      <MultiSelect
        placeholder="All statuses"
        options={STATUS_OPTIONS.map((s) => STATUS_LABELS[s])}
        value={statuses.map((s) => STATUS_LABELS[s])}
        onChange={(labels) =>
          setStatuses(
            labels.map(
              (l) => STATUS_OPTIONS.find((s) => STATUS_LABELS[s] === l)!,
            ),
          )
        }
        wrapClass="w-full sm:w-52"
      />

      {/* Clear */}
      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          leftIcon={<X size={13} />}
        >
          Clear
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1 hidden sm:block" />

      {/* Live tracking toggle */}
      <button
        type="button"
        onClick={toggleLive}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm font-medium',
          'border transition-colors duration-150 outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
          liveTracking
            ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#1D4ED8]'
            : 'bg-[var(--ghost)] border-[var(--border)] text-[var(--ink-mid)] hover:border-[var(--ink-light)]',
        )}
        aria-pressed={liveTracking}
        title="Auto-refresh every 5 seconds"
      >
        <Radio size={14} className={cn(liveTracking && 'animate-pulse')} />
        <span>{liveTracking ? 'Live' : 'Go Live'}</span>
        {liveTracking && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
        )}
      </button>
    </div>
  );
}
