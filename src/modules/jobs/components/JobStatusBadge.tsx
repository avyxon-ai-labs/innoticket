import { cn } from '../../../utils';
import type { JobStatus } from '../../../services/job.service';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<JobStatus, {
  label: string;
  bg:    string;
  text:  string;
  dot:   string;
  pulse: boolean;
}> = {
  PENDING:   { label: 'Pending',     bg: '#FEF9C3', text: '#854D0E', dot: '#CA8A04', pulse: false },
  PROGRESS:  { label: 'In Progress', bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', pulse: true  },
  COMPLETED: { label: 'Completed',   bg: '#F0FDF4', text: '#15803D', dot: '#22C55E', pulse: false },
  FAILED:    { label: 'Failed',      bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', pulse: false },
};

const FALLBACK = { label: 'Unknown', bg: '#F7F7F5', text: '#6B7280', dot: '#9CA3AF', pulse: false };

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  status:     JobStatus;
  className?: string;
}

export function JobStatusBadge({ status, className }: Props) {
  const cfg = STATUS_CONFIG[status] ?? FALLBACK;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'text-[0.7rem] font-semibold tracking-wide whitespace-nowrap font-mono',
        className,
      )}
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.pulse && 'animate-pulse')}
        style={{ backgroundColor: cfg.dot }}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}
