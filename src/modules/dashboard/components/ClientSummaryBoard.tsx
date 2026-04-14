import { useDashboardSummary } from '../hooks';
import { useDashboardStore }   from '../store';
import { cn }                  from '../../../utils';
import type { DashboardSummary } from '../../../services/dashboard.service';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUSES: {
  key:       keyof DashboardSummary;
  label:     string;
  dot:       string;
  textColor: string;
  activeBg?: string;
}[] = [
  { key: 'open',       label: 'Open',        dot: '#3B82F6', textColor: '#1D4ED8', activeBg: '#EFF6FF' },
  { key: 'inProgress', label: 'In Progress', dot: '#7C3AED', textColor: '#5B21B6', activeBg: '#F5F3FF' },
  { key: 'resolved',   label: 'Resolved',    dot: '#16A34A', textColor: '#15803D', activeBg: '#F0FDF4' },
  { key: 'closed',     label: 'Closed',      dot: '#64748B', textColor: '#334155' },
  { key: 'withdrawn',  label: 'Withdrawn',   dot: '#94A3B8', textColor: '#475569' },
  { key: 'rejected',   label: 'Rejected',    dot: '#F97316', textColor: '#C2410C' },
];

const BAR_COLOR: Record<string, string> = {
  open: '#3B82F6', inProgress: '#7C3AED', resolved: '#22C55E',
  closed: '#64748B', withdrawn: '#94A3B8', rejected: '#F97316',
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CLIENT-only status board.
 * All six statuses shown once in a uniform grid — no duplicate numbers.
 * Distribution bar is purely proportional/visual (no repeated legend numbers).
 * No role-checks inside — role routing is handled by DashboardPage.
 */
export function ClientSummaryBoard() {
  const { filters } = useDashboardStore();
  const { projectCode, services, centreCodes } = filters;

  const { data, isLoading } = useDashboardSummary({
    projectCode,
    ...(services.length    && { services:    services.join(',') }),
    ...(centreCodes.length && { centreCodes: centreCodes.join(',') }),
  });

  if (!projectCode) return null;

  const s     = data as DashboardSummary | undefined;
  const total = s?.total ?? 0;

  // Bar segments — proportional visual only, skip zeros
  const barSegments = STATUSES
    .map((st) => ({ key: st.key as string, color: BAR_COLOR[st.key as string], value: (s?.[st.key] as number) ?? 0 }))
    .filter((seg) => seg.value > 0);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2
                      border-b border-[var(--border)] bg-[var(--ghost)]">
        <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-[var(--ink-light)]">
          Ticket Status
        </span>
        {isLoading
          ? <span className="w-10 h-3 rounded animate-pulse bg-[var(--border)] inline-block" />
          : total > 0 && (
            <span className="text-[0.7rem] font-bold text-[var(--ink)] tabular-nums">
              {total.toLocaleString()} total
            </span>
          )}
      </div>

      {/* ── 6-status grid: 2-col mobile → 3-col desktop ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3">
        {STATUSES.map((stat, i) => {
          const val    = (s?.[stat.key] as number) ?? 0;
          const active = val > 0;

          // Grid position used for border logic
          const mobileLeft   = i % 2 === 0;
          const mobileTopRow = i < 2;
          const desktopLeft  = i % 3 === 0;
          const desktopTopRow = i < 3;

          return (
            <div
              key={stat.key}
              className={cn(
                'flex flex-col gap-1 px-4 py-3 transition-colors duration-200',
                // Mobile borders
                !mobileTopRow && 'border-t',
                !mobileLeft   && 'border-l',
                // Desktop border overrides
                desktopTopRow  && 'sm:border-t-0',
                !desktopTopRow && 'sm:border-t',
                desktopLeft    && 'sm:border-l-0',
                !desktopLeft   && 'sm:border-l',
                'border-[var(--border)]',
              )}
              style={active && stat.activeBg ? { background: stat.activeBg } : undefined}
            >
              {/* Label row */}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: active ? stat.dot : '#CBD5E1' }}
                />
                <span className="text-[0.58rem] font-semibold uppercase tracking-wider
                                  text-[var(--ink-light)] leading-none">
                  {stat.label}
                </span>
              </div>

              {/* Number — standard size, same as staff SummaryCards */}
              {isLoading
                ? <div className="h-6 w-10 rounded animate-pulse bg-[var(--border)]" />
                : (
                  <span
                    className="text-[1.45rem] font-black tabular-nums leading-none"
                    style={{ color: active ? stat.textColor : '#CBD5E1' }}
                  >
                    {val.toLocaleString()}
                  </span>
                )}
            </div>
          );
        })}
      </div>

      {/* ── Distribution bar — proportional visual, no repeated numbers ─────── */}
      {!isLoading && total > 0 && (
        <div className="px-4 py-2.5 border-t border-[var(--border)]">
          <div className="flex h-1.5 rounded-full overflow-hidden gap-[2px]">
            {barSegments.map((seg) => (
              <div
                key={seg.key}
                className="h-full transition-all duration-500"
                style={{
                  background:   seg.color,
                  width:        `${(seg.value / total) * 100}%`,
                  minWidth:     4,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
