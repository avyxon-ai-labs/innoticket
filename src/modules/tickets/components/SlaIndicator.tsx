import { cn, formatSlaCountdown } from '../../../utils';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  deadlineIso: string;
  level:       'L1' | 'L2';
}

export function SlaIndicator({ deadlineIso, level }: Props) {
  const { label, breached, urgent } = formatSlaCountdown(deadlineIso);

  return (
    <div
      className={cn(
        'flex flex-col items-start gap-0.5 px-3 py-2 rounded-[10px] border min-w-[96px]',
        breached
          ? 'bg-[#FEF2F2] border-[#FECACA]'
          : urgent
            ? 'bg-[#FFF7ED] border-[#FED7AA]'
            : 'bg-[var(--ghost)] border-[var(--border)]',
      )}
    >
      <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--ink-light)]">
        SLA {level}
      </span>
      <span
        className={cn(
          'text-xs font-bold',
          breached ? 'text-[#DC2626]' : urgent ? 'text-[#C2410C]' : 'text-[var(--ink)]',
        )}
      >
        {label}
      </span>
    </div>
  );
}
