import { cn } from '../../../utils';
import type { JobStatus } from '../../../services/job.service';

interface Props {
  processedRows: number;
  totalRows:     number;
  status:        JobStatus;
  showLabel?:    boolean;
  className?:    string;
}

const BAR_COLOR: Partial<Record<JobStatus, string>> = {
  PENDING:   '#CA8A04',
  PROGRESS:  '#3B82F6',
  COMPLETED: '#22C55E',
  FAILED:    '#EF4444',
};

export function JobProgressBar({
  processedRows,
  totalRows,
  status,
  showLabel = true,
  className,
}: Props) {
  const pct   = totalRows > 0 ? Math.min(100, Math.round((processedRows / totalRows) * 100)) : 0;
  const color = (status && BAR_COLOR[status]) ?? '#94A3B8';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-[var(--ink-light)]">
          <span>
            {processedRows.toLocaleString()} / {totalRows.toLocaleString()} rows
          </span>
          <span className="font-mono font-semibold" style={{ color }}>
            {pct}%
          </span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-[var(--ghost)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
