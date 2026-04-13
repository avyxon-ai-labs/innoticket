import { useEffect, useState }   from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { Loader2, BarChart2, Table2,
         ChevronLeft, ChevronRight }  from 'lucide-react';
import { useDashboardAggregation }    from '../hooks';
import { useDashboardStore }          from '../store';
import { cn }                         from '../../../utils';
import type { AggregationDimension,
              DashboardAggregationGroup } from '../../../services/dashboard.service';

// ── Config ────────────────────────────────────────────────────────────────────

const DIMENSIONS: { key: AggregationDimension; label: string }[] = [
  { key: 'centreCode', label: 'Centre'  },
  { key: 'city',       label: 'City'    },
  { key: 'state',      label: 'State'   },
];

const SERIES = [
  { key: 'open',        label: 'Open',        color: '#3B82F6' },
  { key: 'inProgress',  label: 'In Progress', color: '#7C3AED' },
  { key: 'escalatedL1', label: 'Esc. L1',     color: '#F59E0B' },
  { key: 'escalatedL2', label: 'Esc. L2',     color: '#EF4444' },
  { key: 'resolved',    label: 'Resolved',    color: '#22C55E' },
  { key: 'closed',      label: 'Closed',      color: '#64748B' },
] as const;

const LIMIT_OPTIONS = [10, 15, 20];

// px allocated per bar group (bar + gap)
const BAR_SLOT   = 64;
const CHART_H    = 340;
const CHART_MARGIN = { top: 28, right: 16, left: 8, bottom: 56 };

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px]
                    p-3 shadow-lg shadow-black/10 min-w-[150px]">
      <p className="text-xs font-bold text-[var(--ink)] mb-1.5 pb-1.5
                    border-b border-[var(--border)] truncate max-w-[180px]">
        {label}
      </p>
      {payload.filter((p) => p.value > 0).map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-[2px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[0.68rem] text-[var(--ink-light)]">{p.name}</span>
          </div>
          <span className="text-[0.68rem] font-bold text-[var(--ink)] tabular-nums">{p.value}</span>
        </div>
      ))}
      <div className="border-t border-[var(--border)] mt-1.5 pt-1.5 flex justify-between">
        <span className="text-[0.68rem] text-[var(--ink-light)]">Total</span>
        <span className="text-[0.68rem] font-bold text-[var(--ink)] tabular-nums">{total}</span>
      </div>
    </div>
  );
}

// ── X-axis tick — angled, truncated for long codes ────────────────────────────

function XTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const label = payload?.value ?? '';
  const short = label.length > 12 ? label.slice(0, 11) + '…' : label;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0} y={0} dy={8}
        textAnchor="end"
        fill="#94A3B8"
        fontSize={9}
        transform="rotate(-38)"
      >
        {short}
      </text>
    </g>
  );
}

// ── Inside-segment label — hides when value is 0 or segment too small ─────────

function SegmentLabel(props: {
  x?: number; y?: number; width?: number; height?: number; value?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  if (!value || height < 16 || width < 18) return null;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={9}
      fontWeight="700"
      fill="rgba(255,255,255,0.92)"
    >
      {value}
    </text>
  );
}

// ── Total label on top of the full stacked bar ────────────────────────────────

function TotalLabel(props: {
  x?: number; y?: number; width?: number; value?: number;
}) {
  const { x = 0, y = 0, width = 0, value } = props;
  if (!value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      textAnchor="middle"
      dominantBaseline="auto"
      fontSize={10}
      fontWeight="700"
      fill="var(--ink)"
    >
      {value}
    </text>
  );
}

// ── Aggregation Table ─────────────────────────────────────────────────────────

const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={cn(
    'px-2.5 py-2 text-[0.58rem] font-semibold uppercase tracking-wider',
    'text-[var(--ink-light)] border-b border-[var(--border)] whitespace-nowrap',
    right ? 'text-right' : 'text-left',
  )}>
    {children}
  </th>
);

const TD = ({ children, right, bold }: { children: React.ReactNode; right?: boolean; bold?: boolean }) => (
  <td className={cn(
    'px-2.5 py-2 text-xs border-b border-[var(--border)]',
    right ? 'text-right tabular-nums' : '',
    bold ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-mid)]',
  )}>
    {children}
  </td>
);

function AggregationTable({ data, dimension }: {
  data: DashboardAggregationGroup[];
  dimension: AggregationDimension;
}) {
  const [page, setPage] = useState(0);
  const PAGE = 15;
  const totalPages = Math.ceil(data.length / PAGE);
  const rows = data.slice(page * PAGE, (page + 1) * PAGE);
  const dimLabel = DIMENSIONS.find((d) => d.key === dimension)?.label ?? 'Group';

  // Reset page when data changes
  useEffect(() => { setPage(0); }, [data]);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 520 }}>
          <thead>
            <tr className="bg-[var(--ghost)]">
              <TH>{dimLabel}</TH>
              <TH right>Open</TH>
              <TH right>In Prog.</TH>
              <TH right>Esc. L1</TH>
              <TH right>Esc. L2</TH>
              <TH right>Resolved</TH>
              <TH right>Closed</TH>
              <TH right>Total</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.groupBy} className="hover:bg-[var(--ghost)] transition-colors">
                <TD bold>
                  <span className="font-mono text-[0.68rem]">{r.groupBy || '—'}</span>
                </TD>
                <TD right>
                  <span className={r.open > 0 ? 'text-[#2563EB] font-semibold' : ''}>{r.open || '—'}</span>
                </TD>
                <TD right>
                  <span className={r.inProgress > 0 ? 'text-[#7C3AED] font-semibold' : ''}>{r.inProgress || '—'}</span>
                </TD>
                <TD right>
                  <span className={r.escalatedL1 > 0 ? 'text-[#D97706] font-semibold' : ''}>{r.escalatedL1 || '—'}</span>
                </TD>
                <TD right>
                  <span className={r.escalatedL2 > 0 ? 'text-[#DC2626] font-semibold' : ''}>{r.escalatedL2 || '—'}</span>
                </TD>
                <TD right>
                  <span className={r.resolved > 0 ? 'text-[#16A34A] font-semibold' : ''}>{r.resolved || '—'}</span>
                </TD>
                <TD right>{r.closed || '—'}</TD>
                <TD right bold>{r.total.toLocaleString()}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2.5 py-2 border-t border-[var(--border)]">
          <span className="text-[0.65rem] text-[var(--ink-light)]">
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, data.length)} of {data.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-1 text-xs rounded-[6px] text-[var(--ink-light)]
                         hover:bg-[var(--ghost)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹ Prev
            </button>
            <span className="text-xs text-[var(--ink-light)] tabular-nums px-1">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 text-xs rounded-[6px] text-[var(--ink-light)]
                         hover:bg-[var(--ghost)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AggregationChart() {
  const { filters, dimension, setDimension } = useDashboardStore();
  const { projectCode, services, escalationTypes, centreCodes } = filters;

  const [view,       setView]       = useState<'chart' | 'table'>('chart');
  const [limit,      setLimit]      = useState(15);
  const [chartPage,  setChartPage]  = useState(0);

  const { data: rawData = [], isLoading, isError } = useDashboardAggregation({
    projectCode,
    dimension,
    ...(services.length        && { services:        services.join(',')        }),
    ...(escalationTypes.length && { escalationTypes: escalationTypes.join(',') }),
    ...(centreCodes.length     && { centreCodes:     centreCodes.join(',')     }),
  });

  // Reset chart page when dimension, limit, or data source changes
  useEffect(() => { setChartPage(0); }, [dimension, limit, rawData.length]);

  if (!projectCode) return null;

  const totalChartPages = Math.ceil(rawData.length / limit);
  const chartData       = rawData.slice(chartPage * limit, (chartPage + 1) * limit);

  // Each bar gets a fixed slot width; chart scrolls horizontally if wider than container
  const chartWidth = Math.max(360, chartData.length * BAR_SLOT + CHART_MARGIN.left + CHART_MARGIN.right);

  const rangeStart = chartPage * limit + 1;
  const rangeEnd   = Math.min((chartPage + 1) * limit, rawData.length);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3
                      border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--ink)]">Ticket Distribution</h3>
          <p className="text-xs text-[var(--ink-light)] mt-0.5">
            {rawData.length.toLocaleString()} {DIMENSIONS.find((d) => d.key === dimension)?.label.toLowerCase()} groups
            {view === 'chart' && rawData.length > limit && ` · showing ${rangeStart}–${rangeEnd}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Dimension */}
          <div className="flex items-center gap-0.5 bg-[var(--ghost)] border border-[var(--border)]
                          rounded-[8px] p-0.5">
            {DIMENSIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDimension(d.key)}
                className={cn(
                  'px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all',
                  dimension === d.key
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--ink-light)] hover:text-[var(--ink)]',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Bars per page (chart only) */}
          {view === 'chart' && (
            <div className="flex items-center gap-0.5 bg-[var(--ghost)] border border-[var(--border)]
                            rounded-[8px] p-0.5">
              {LIMIT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setLimit(n)}
                  className={cn(
                    'px-2 py-1 rounded-[6px] text-xs font-semibold transition-all',
                    limit === n
                      ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--ink-light)] hover:text-[var(--ink)]',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--ghost)] border border-[var(--border)]
                          rounded-[8px] p-0.5">
            <button
              onClick={() => setView('chart')}
              title="Chart view"
              className={cn(
                'p-1.5 rounded-[6px] transition-all',
                view === 'chart'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                  : 'text-[var(--ink-light)] hover:text-[var(--ink)]',
              )}
            >
              <BarChart2 size={13} />
            </button>
            <button
              onClick={() => setView('table')}
              title="Table view"
              className={cn(
                'p-1.5 rounded-[6px] transition-all',
                view === 'table'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                  : 'text-[var(--ink-light)] hover:text-[var(--ink)]',
              )}
            >
              <Table2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={18} className="animate-spin text-[var(--ink-light)]" />
        </div>
      ) : isError ? (
        <p className="text-xs text-center text-[var(--ink-light)] py-10">Failed to load data.</p>
      ) : rawData.length === 0 ? (
        <p className="text-xs text-center text-[var(--ink-light)] py-10">No data for selected filters.</p>
      ) : view === 'table' ? (
        <AggregationTable data={rawData} dimension={dimension} />
      ) : (
        <div className="px-4 pt-3 pb-2">
          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-[0.65rem] text-[var(--ink-light)]">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Scrollable chart area — each bar gets a fixed slot, so the SVG grows wide */}
          <div className="overflow-x-auto">
            <div style={{ width: chartWidth, height: CHART_H }}>
              <BarChart
                width={chartWidth}
                height={CHART_H}
                data={chartData}
                margin={CHART_MARGIN}
                barCategoryGap="30%"
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="category"
                  dataKey="groupBy"
                  tick={<XTick />}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  tickFormatter={(v) => (v === 0 ? '0' : String(v))}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />

                {SERIES.map((s, i) => {
                  const isLast = i === SERIES.length - 1;
                  return (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      name={s.label}
                      stackId="a"
                      fill={s.color}
                      radius={isLast ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                      isAnimationActive={chartData.length <= 100}
                    >
                      {/* Count inside each segment */}
                      <LabelList dataKey={s.key} content={<SegmentLabel />} />

                      {/* Total on top of the full stack — only on the last series */}
                      {isLast && (
                        <LabelList dataKey="total" content={<TotalLabel />} />
                      )}
                    </Bar>
                  );
                })}
              </BarChart>
            </div>
          </div>

          {/* Chart pagination — only shown when data exceeds one page */}
          {totalChartPages > 1 && (
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-[var(--border)]">
              <span className="text-[0.65rem] text-[var(--ink-light)] tabular-nums">
                {rangeStart}–{rangeEnd} of {rawData.length.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={chartPage === 0}
                  onClick={() => setChartPage((p) => p - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-[6px]
                             text-[var(--ink-light)] hover:bg-[var(--ghost)]
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="text-[0.65rem] text-[var(--ink-light)] tabular-nums px-1">
                  {chartPage + 1} / {totalChartPages}
                </span>
                <button
                  disabled={chartPage >= totalChartPages - 1}
                  onClick={() => setChartPage((p) => p + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-[6px]
                             text-[var(--ink-light)] hover:bg-[var(--ghost)]
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
