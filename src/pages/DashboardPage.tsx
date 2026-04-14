import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, TableIcon,
         Radio, Square }                            from 'lucide-react';
import { useQueryClient }                           from '@tanstack/react-query';
import { DashboardFilters }     from '../modules/dashboard/components/DashboardFilters';
import { SummaryCards }         from '../modules/dashboard/components/SummaryCards';
import { ClientSummaryBoard }   from '../modules/dashboard/components/ClientSummaryBoard';
import { AggregationChart }     from '../modules/dashboard/components/AggregationChart';
import { StatusDonutChart }     from '../modules/dashboard/components/StatusDonutChart';
import { ClientDonutChart }     from '../modules/dashboard/components/ClientDonutChart';
import { DashboardTabs }        from '../modules/dashboard/components/DashboardTabs';
import { DashboardTicketTable } from '../modules/dashboard/components/DashboardTicketTable';
import { TicketDetail }         from '../modules/tickets/components/TicketDetail';
import { TicketStatusDialog }   from '../modules/tickets/components/TicketStatusDialog';
import { useNavigationStore }   from '../store/navigationStore';
import { useDashboardStore }    from '../modules/dashboard/store';
import { useAuthStore }         from '../store/authStore';
import { cn }                   from '../utils';

// ── IST helpers ───────────────────────────────────────────────────────────────

/** Current hour in IST (UTC+5:30). */
function istHour(): number {
  return new Date(Date.now() + 330 * 60_000).getUTCHours();
}

/** Refresh interval in ms based on IST daytime window (09:00–19:00). */
function liveInterval(): number {
  const h = istHour();
  return h >= 9 && h < 19 ? 30_000 : 120_000;
}

function intervalLabel(): string {
  return liveInterval() === 30_000 ? '30s' : '2m';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { current, resetStack } = useNavigationStore();
  const { isLive, setIsLive }   = useDashboardStore();
  const user                    = useAuthStore((s) => s.user);
  const isClient                = user?.role?.toUpperCase() === 'CLIENT';
  const queryClient             = useQueryClient();
  const [tableOpen, setTableOpen]       = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [, forceRender]                 = useState(0); // tick to re-render interval label
  const timerRef                        = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    resetStack({ module: 'dashboard', subView: 'list' });
  }, [resetStack]);

  // ── Auto-refresh engine ───────────────────────────────────────────────────

  const doRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
    setLastRefreshed(new Date());
  }, [queryClient]);

  useEffect(() => {
    if (!isLive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Recursive setTimeout — recalculates interval on every tick so the IST
    // window change (9am / 7pm) is picked up automatically.
    function schedule() {
      timerRef.current = setTimeout(() => {
        doRefresh();
        forceRender((n) => n + 1); // re-render so interval label stays current
        schedule();
      }, liveInterval());
    }

    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isLive, doRefresh]);

  // ── Navigation guard ──────────────────────────────────────────────────────

  const isDetail =
    current?.module === 'tickets' &&
    current?.subView === 'detail' &&
    !!current?.selectedId;

  if (isDetail) {
    return (
      <>
        <TicketDetail ticketId={current!.selectedId as string} />
        <TicketStatusDialog />
      </>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Live overview of ticket health across projects and centres.
          </p>
        </div>

        {/* Go Live button */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isLive ? (
            <button
              onClick={() => setIsLive(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-xs font-semibold',
                'bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D]',
                'hover:bg-[#BBF7D0] transition-colors',
              )}
            >
              {/* Pulsing live dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full
                                 bg-[#22C55E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
              </span>
              Live · {intervalLabel()}
              <Square size={10} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={() => { setIsLive(true); doRefresh(); }}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-xs font-semibold',
                'border border-[var(--border)] bg-[var(--ghost)] text-[var(--ink-mid)]',
                'hover:border-[#22C55E] hover:text-[#15803D] hover:bg-[#F0FDF4]',
                'transition-colors',
              )}
            >
              <Radio size={13} />
              Go Live
            </button>
          )}

          {/* Last refreshed timestamp */}
          {lastRefreshed && (
            <span className="text-[0.6rem] text-[var(--ink-light)]">
              Refreshed {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-4 py-3">
        <DashboardFilters />
      </div>

      {/* ── Summary row — component selected by role at mount time ───────── */}
      {isClient ? <ClientSummaryBoard /> : <SummaryCards />}

      {/* ── Chart row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <AggregationChart />
        {isClient ? <ClientDonutChart /> : <StatusDonutChart />}
      </div>

      {/* ── Deep-dive table ────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] overflow-hidden">
        <button
          onClick={() => setTableOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3
                     hover:bg-[var(--ghost)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <TableIcon size={13} className="text-[var(--ink-light)]" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
              Ticket Deep Dive
            </span>
          </div>
          {tableOpen
            ? <ChevronUp  size={13} className="text-[var(--ink-light)]" />
            : <ChevronDown size={13} className="text-[var(--ink-light)]" />}
        </button>

        {tableOpen && (
          <div className="border-t border-[var(--border)] px-4 pt-3 pb-4 flex flex-col gap-3">
            <DashboardTabs />
            <DashboardTicketTable flat />
          </div>
        )}
      </div>

      <TicketStatusDialog />
    </div>
  );
}
