import { useState }                   from 'react';
import { CheckCircle2, Download, Clock } from 'lucide-react';
import { Modal }                        from '../../../components/ui/Modal';
import { Spinner }                      from '../../../components/ui/Spinner';
import { Button }                       from '../../../components/ui/Button';
import { JobStatusBadge }               from './JobStatusBadge';
import { JobProgressBar }               from './JobProgressBar';
import { JobErrorDialog }               from './JobErrorDialog';
import { useJobPolling }                from '../hooks';
import { useJobStore }                  from '../store';
import { formatLocalDateTime }          from '../../../utils';
import type { JobStatus }               from '../../../services/job.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const JOB_TYPE_LABELS: Record<string, string> = {
  BULK_USER_ADD:        'Bulk User Add',
  BULK_CENTER_GRID_ADD: 'Bulk Centre Grid Add',
};

const STEP_COLOR: Record<JobStatus, string> = {
  PENDING:   '#CA8A04',
  PROGRESS:  '#3B82F6',
  COMPLETED: '#22C55E',
  FAILED:    '#EF4444',
};

// ── Phase pipeline ────────────────────────────────────────────────────────────

function PhasePipeline({ phase, status }: { phase: string; status: JobStatus }) {
  const steps   = phase.split('~').filter(Boolean);
  const last    = steps.length - 1;
  const accent  = STEP_COLOR[status] ?? '#94A3B8';

  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((step, i) => {
        const isCurrent = i === last;
        const isDone    = i < last;
        return (
          <div key={step} className="flex items-center gap-1">
            <span
              className="px-2 py-0.5 rounded-md text-[0.65rem] font-semibold font-mono tracking-wide"
              style={
                isCurrent
                  ? { backgroundColor: `${accent}1A`, color: accent, border: `1px solid ${accent}40` }
                  : isDone
                  ? { backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC' }
                  : { backgroundColor: 'var(--ghost)', color: 'var(--ink-light)', border: '1px solid var(--border)' }
              }
            >
              {step}
            </span>
            {i < last && (
              <span className="text-[0.6rem] text-[var(--ink-light)]">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobProgressPanel() {
  const { pollingJobId, closePolling } = useJobStore();
  const { data: job, isLoading }       = useJobPolling(pollingJobId);
  const [errorOpen, setErrorOpen]      = useState(false);

  const isTerminal =
    job?.status === 'COMPLETED' ||
    job?.status === 'FAILED';

  const hasErrors = !!(job?.errorDetails) && job?.status === 'FAILED';

  return (
    <>
      <Modal
        open={pollingJobId != null}
        onClose={closePolling}
        title="Job Progress"
        description={job ? (JOB_TYPE_LABELS[job.jobType] ?? job.jobType) : ''}
        closeOnBackdrop={isTerminal}
        footer={
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            {/* File download */}
            {job?.fileUrl && (
              <a
                href={job.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium
                           text-[var(--sage)] hover:text-[var(--sage-dark)] transition-colors"
              >
                <Download size={13} />
                Download File
              </a>
            )}
            <div className={`flex gap-2 ${job?.fileUrl ? '' : 'ml-auto'}`}>
              {hasErrors && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setErrorOpen(true)}
                >
                  View Errors
                </Button>
              )}
              {isTerminal && (
                <Button size="sm" onClick={closePolling}>Done</Button>
              )}
            </div>
          </div>
        }
      >
        {isLoading || !job ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Status row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <JobStatusBadge status={job.status} />
              {!isTerminal && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--ink-light)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                  Polling every 2 s…
                </span>
              )}
            </div>

            {/* Phase pipeline */}
            {job.phase && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--ink-light)]">
                  Pipeline
                </span>
                <PhasePipeline phase={job.phase} status={job.status} />
              </div>
            )}

            {/* Progress bar */}
            <JobProgressBar
              processedRows={job.processedRows}
              totalRows={job.totalRows}
              status={job.status}
              showLabel
            />

            {/* Message */}
            {job.message && (
              <p className="text-xs text-[var(--ink-mid)] bg-[var(--ghost)]
                            rounded-[10px] border border-[var(--border)] px-3 py-2">
                {job.message}
              </p>
            )}

            {/* Timing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--ink-light)]">
                  Created
                </span>
                <span className="text-xs text-[var(--ink)] flex items-center gap-1">
                  <Clock size={11} className="text-[var(--ink-light)]" />
                  {formatLocalDateTime(job.createdAt)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--ink-light)]">
                  Last Updated
                </span>
                <span className="text-xs text-[var(--ink)] flex items-center gap-1">
                  <Clock size={11} className="text-[var(--ink-light)]" />
                  {formatLocalDateTime(job.updatedAt)}
                </span>
              </div>
            </div>

            {/* Completed banner */}
            {job.status === 'COMPLETED' && (
              <div className="flex items-center gap-2 rounded-[10px] bg-[#F0FDF4]
                              border border-[#86EFAC] px-3 py-2.5">
                <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                <p className="text-sm text-[#15803D] font-medium">
                  All {job.totalRows.toLocaleString()} rows processed successfully.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Error dialog */}
      <JobErrorDialog
        job={errorOpen ? job ?? null : null}
        onClose={() => setErrorOpen(false)}
      />
    </>
  );
}
