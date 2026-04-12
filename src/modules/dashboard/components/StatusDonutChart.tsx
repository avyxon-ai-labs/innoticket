import { useState, useRef }    from 'react';
import { Loader2 }              from 'lucide-react';
import { useDashboardSummary }  from '../hooks';
import { useDashboardStore }    from '../store';
import type { DashboardSummary } from '../../../services/dashboard.service';

// ── SVG helpers ───────────────────────────────────────────────────────────────

const CX = 80, CY = 80, R = 60, IR = 38;

/** 0° = 12-o'clock, clockwise */
function toRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180;
}

/** Annular sector path string */
function sector(startDeg: number, sweep: number): string {
  const clampedSweep = Math.min(sweep, 359.9);
  const endDeg = startDeg + clampedSweep;
  const s = toRad(startDeg), e = toRad(endDeg);
  const large = clampedSweep > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(3);
  const x1 = CX + R  * Math.cos(s), y1 = CY + R  * Math.sin(s);
  const x2 = CX + R  * Math.cos(e), y2 = CY + R  * Math.sin(e);
  const x3 = CX + IR * Math.cos(e), y3 = CY + IR * Math.sin(e);
  const x4 = CX + IR * Math.cos(s), y4 = CY + IR * Math.sin(s);
  return `M${f(x1)},${f(y1)} A${R},${R},0,${large},1,${f(x2)},${f(y2)} `
       + `L${f(x3)},${f(y3)} A${IR},${IR},0,${large},0,${f(x4)},${f(y4)} Z`;
}

// ── Slice config ──────────────────────────────────────────────────────────────

const SLICES: { key: keyof DashboardSummary; label: string; color: string }[] = [
  { key: 'open',        label: 'Open',        color: '#3B82F6' },
  { key: 'inProgress',  label: 'In Progress', color: '#7C3AED' },
  { key: 'escalatedL1', label: 'Esc. L1',     color: '#F59E0B' },
  { key: 'escalatedL2', label: 'Esc. L2',     color: '#EF4444' },
  { key: 'resolved',    label: 'Resolved',    color: '#22C55E' },
  { key: 'closed',      label: 'Closed',      color: '#64748B' },
  { key: 'withdrawn',   label: 'Withdrawn',   color: '#94A3B8' },
  { key: 'rejected',    label: 'Rejected',    color: '#F97316' },
];

const GAP = 2; // degrees gap between segments

// ── Tooltip type ──────────────────────────────────────────────────────────────

interface Tip {
  x: number; y: number;
  label: string; value: number; pct: string; color: string;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function StatusDonutChart() {
  const { filters } = useDashboardStore();
  const { projectCode, services, escalationTypes, centreCodes } = filters;

  const [hovered, setHovered] = useState<string | null>(null);
  const [tip,     setTip]     = useState<Tip | null>(null);
  const svgRef                = useRef<SVGSVGElement>(null);

  const { data, isLoading } = useDashboardSummary({
    projectCode,
    ...(services.length        && { services:        services.join(',') }),
    ...(escalationTypes.length && { escalationTypes: escalationTypes.join(',') }),
    ...(centreCodes.length     && { centreCodes:     centreCodes.join(',') }),
  });

  if (!projectCode) return null;

  const s     = data as DashboardSummary | undefined;
  const total = s?.total ?? 0;
  const hasData = total > 0;

  // Build segments
  const rawSlices = SLICES
    .map((sl) => ({ ...sl, value: (s?.[sl.key] as number) ?? 0 }))
    .filter((sl) => sl.value > 0);

  const n = rawSlices.length;
  let cumAngle = 0;
  const segments = rawSlices.map((sl) => {
    const full  = (sl.value / total) * 360;
    const gap   = n > 1 ? GAP : 0;
    const start = cumAngle + gap / 2;
    const sweep = Math.max(full - gap, 0.5);
    cumAngle += full;
    return { ...sl, start, sweep, pct: ((sl.value / total) * 100).toFixed(1) };
  });

  // Escalation context
  const l1 = s?.escalatedL1 ?? 0;
  const l2 = s?.escalatedL2 ?? 0;
  const active = (s?.open ?? 0) + (s?.inProgress ?? 0);
  const anyEscalated = (l1 > 0 || l2 > 0) && active > 0;

  function updateTip(e: React.MouseEvent, seg: typeof segments[0]) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered(seg.key as string);
    setTip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      label: seg.label,
      value: seg.value,
      pct:   seg.pct,
      color: seg.color,
    });
  }

  function clearTip() {
    setHovered(null);
    setTip(null);
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4
                    flex flex-col gap-3">

      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-[var(--ink)]">Health Overview</h3>
        <p className="text-xs text-[var(--ink-light)] mt-0.5">Status breakdown</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin text-[var(--ink-light)]" />
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-xs text-[var(--ink-light)]">No data</p>
        </div>
      ) : (
        <>
          {/* ── Donut ── */}
          <div
            className="relative flex justify-center"
            onMouseLeave={clearTip}
          >
            <svg
              ref={svgRef}
              width={160}
              height={160}
              viewBox="0 0 160 160"
              className="overflow-visible"
            >
              {segments.map((seg) => (
                <path
                  key={seg.key as string}
                  d={sector(seg.start, seg.sweep)}
                  fill={seg.color}
                  opacity={hovered && hovered !== seg.key ? 0.25 : 1}
                  className="transition-opacity duration-150 cursor-pointer"
                  onMouseEnter={(e) => updateTip(e, seg)}
                  onMouseMove={(e)  => updateTip(e, seg)}
                  onMouseLeave={clearTip}
                />
              ))}

              {/* Centre label */}
              <text
                x={CX} y={CY - 7}
                textAnchor="middle"
                style={{
                  fontSize: 21, fontWeight: 900,
                  fill: 'var(--ink)', fontFamily: 'inherit',
                }}
              >
                {total.toLocaleString()}
              </text>
              <text
                x={CX} y={CY + 11}
                textAnchor="middle"
                style={{
                  fontSize: 7, fontWeight: 700,
                  letterSpacing: '0.12em',
                  fill: '#94A3B8',
                  fontFamily: 'inherit',
                }}
              >
                TICKETS
              </text>
            </svg>

            {/* Floating tooltip */}
            {tip && (
              <div
                className="absolute z-20 pointer-events-none
                            bg-[var(--surface)] border border-[var(--border)]
                            rounded-[8px] px-2.5 py-1.5 shadow-md shadow-black/10 text-xs"
                style={{ left: tip.x + 12, top: Math.max(4, tip.y - 44) }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tip.color }} />
                  <span className="font-semibold text-[var(--ink)]">{tip.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-black tabular-nums text-[var(--ink)]">
                    {tip.value.toLocaleString()}
                  </span>
                  <span className="text-[var(--ink-light)]">{tip.pct}%</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Legend — 2-col compact grid ── */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {segments.map((seg) => (
              <div
                key={seg.key as string}
                className="flex items-center gap-1.5 cursor-default select-none"
                onMouseEnter={() => setHovered(seg.key as string)}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-transform duration-150"
                  style={{
                    background: seg.color,
                    transform: hovered === seg.key ? 'scale(1.5)' : 'scale(1)',
                  }}
                />
                <span className="text-[0.62rem] text-[var(--ink-light)] flex-1 truncate leading-none">
                  {seg.label}
                </span>
                <span className="text-[0.65rem] font-semibold text-[var(--ink)] tabular-nums shrink-0">
                  {seg.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* ── Escalation bars ── */}
          {anyEscalated && (
            <div className="border-t border-[var(--border)] pt-3 flex flex-col gap-2">
              <p className="text-[0.58rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
                Escalated · {active} active
              </p>
              {([
                { label: 'L2', value: l2, bar: '#EF4444', text: '#B91C1C' },
                { label: 'L1', value: l1, bar: '#F59E0B', text: '#92400E' },
              ] as const).filter((e) => e.value > 0).map((esc) => (
                <div key={esc.label} className="flex items-center gap-2">
                  <span className="text-[0.6rem] font-semibold text-[var(--ink-light)] w-4 shrink-0 leading-none">
                    {esc.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        background: esc.bar,
                        width: `${(esc.value / active) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className="text-[0.65rem] font-bold tabular-nums w-5 text-right shrink-0"
                    style={{ color: esc.text }}
                  >
                    {esc.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
