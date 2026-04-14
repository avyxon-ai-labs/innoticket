import { useDashboardSummary } from '../hooks';
import { useDashboardStore }   from '../store';
import type { DashboardSummary } from '../../../services/dashboard.service';

// ── Config ────────────────────────────────────────────────────────────────────

const ACTIVE: {
  key:       keyof DashboardSummary;
  label:     string;
  dot:       string;
  textColor: string;
  bg:        string;
  border:    string;
  alert:     boolean;
}[] = [
  { key: 'open',        label: 'Open',        dot: '#3B82F6', textColor: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', alert: false },
  { key: 'inProgress',  label: 'In Progress', dot: '#7C3AED', textColor: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE', alert: false },
  { key: 'escalatedL1', label: 'Esc L1',      dot: '#F59E0B', textColor: '#92400E', bg: '#FFFBEB', border: '#FDE68A', alert: true  },
  { key: 'escalatedL2', label: 'Esc L2',      dot: '#EF4444', textColor: '#991B1B', bg: '#FEF2F2', border: '#FECACA', alert: true  },
];

const TERMINAL: { key: keyof DashboardSummary; label: string; color: string }[] = [
  { key: 'resolved',  label: 'Resolved',  color: '#16A34A' },
  { key: 'closed',    label: 'Closed',    color: '#475569' },
  { key: 'withdrawn', label: 'Withdrawn', color: '#94A3B8' },
  { key: 'rejected',  label: 'Rejected',  color: '#C2410C' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SummaryCards() {
  const { filters } = useDashboardStore();
  const { projectCode, services, escalationTypes, centreCodes } = filters;

  const { data, isLoading } = useDashboardSummary({
    projectCode,
    ...(services.length        && { services:        services.join(',') }),
    ...(escalationTypes.length && { escalationTypes: escalationTypes.join(',') }),
    ...(centreCodes.length     && { centreCodes:     centreCodes.join(',') }),
  });

  if (!projectCode) return null;

  const s = data as DashboardSummary | undefined;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden">

      {/* ── Active stats — 4 cells ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {ACTIVE.map((stat, i) => {
          const val     = (s?.[stat.key] as number | undefined) ?? 0;
          const hot     = stat.alert && val > 0;
          const isRight = i % 2 === 1;
          const smBorderL = i > 0;

          return (
            <div
              key={stat.key}
              className={[
                'flex flex-col gap-1 px-4 py-3 transition-colors duration-200',
                isRight    ? 'border-l border-[var(--border)]' : '',
                i >= 2     ? 'border-t border-[var(--border)] sm:border-t-0' : '',
                smBorderL  ? 'sm:border-l sm:border-[var(--border)]' : '',
              ].join(' ')}
              style={hot ? { background: stat.bg } : undefined}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: hot ? stat.dot : '#CBD5E1' }}
                />
                <span className="text-[0.58rem] font-semibold uppercase tracking-wider
                                  text-[var(--ink-light)] leading-none">
                  {stat.label}
                </span>
                {hot && (
                  <span
                    className="ml-auto text-[0.48rem] font-black px-1 py-px rounded leading-none"
                    style={{ background: stat.border, color: stat.textColor }}
                  >
                    ●
                  </span>
                )}
              </div>

              {isLoading
                ? <div className="h-6 w-10 rounded animate-pulse bg-[var(--border)]" />
                : (
                  <span
                    className="text-[1.45rem] font-black tabular-nums leading-none"
                    style={{ color: hot ? stat.textColor : 'var(--ink)' }}
                  >
                    {val.toLocaleString()}
                  </span>
                )
              }
            </div>
          );
        })}
      </div>

      {/* ── Terminal — compact info strip ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2
                      border-t border-[var(--border)] bg-[var(--ghost)]">
        <span className="text-[0.58rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
          Closed out
        </span>

        {TERMINAL.map((stat, i) => (
          <div key={stat.key} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-[var(--ink-light)] opacity-30 mr-1 text-[0.65rem]">·</span>
            )}
            {isLoading
              ? <span className="w-5 h-2.5 rounded animate-pulse bg-[var(--border)] inline-block" />
              : (
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: stat.color }}
                >
                  {((s?.[stat.key] as number | undefined) ?? 0).toLocaleString()}
                </span>
              )
            }
            <span className="text-[0.6rem] text-[var(--ink-light)]">{stat.label}</span>
          </div>
        ))}

        {!isLoading && s?.total != null && (
          <span className="ml-auto text-[0.6rem] text-[var(--ink-light)] tabular-nums">
            {s.total.toLocaleString()} total
          </span>
        )}
      </div>
    </div>
  );
}
