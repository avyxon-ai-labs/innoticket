import { cn } from '../../../utils';
import type { TicketStatus } from '../../../services/ticket.service';

// ── Config ────────────────────────────────────────────────────────────────────

const CONFIG: Record<TicketStatus, {
  label: string;
  bg:    string;
  text:  string;
  dot:   string;
}> = {
  OPEN:        { label: 'Open',        bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  IN_PROGRESS: { label: 'In Progress', bg: '#F5F3FF', text: '#6D28D9', dot: '#7C3AED' },
  RESOLVED:    { label: 'Resolved',    bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  CLOSED:      { label: 'Closed',      bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  WITHDRAWN:   { label: 'Withdrawn',   bg: '#F8FAFC', text: '#64748B', dot: '#CBD5E1' },
  REJECTED:    { label: 'Rejected',    bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
};

const FALLBACK = { label: 'Unknown', bg: '#F7F7F5', text: '#6B7280', dot: '#9CA3AF' };

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  status:    TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className }: Props) {
  const cfg = CONFIG[status] ?? FALLBACK;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'text-[0.68rem] font-semibold whitespace-nowrap',
        className,
      )}
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: cfg.dot }}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}
