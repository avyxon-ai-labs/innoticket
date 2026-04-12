import { useState, useEffect }         from 'react';
import { ChevronDown, ChevronUp,
         TableIcon }                   from 'lucide-react';
import { DashboardFilters }            from '../modules/dashboard/components/DashboardFilters';
import { SummaryCards }                from '../modules/dashboard/components/SummaryCards';
import { AggregationChart }            from '../modules/dashboard/components/AggregationChart';
import { StatusDonutChart }            from '../modules/dashboard/components/StatusDonutChart';
import { DashboardTabs }               from '../modules/dashboard/components/DashboardTabs';
import { DashboardTicketTable }        from '../modules/dashboard/components/DashboardTicketTable';
import { TicketDetail }                from '../modules/tickets/components/TicketDetail';
import { TicketStatusDialog }          from '../modules/tickets/components/TicketStatusDialog';
import { useNavigationStore }          from '../store/navigationStore';

export function DashboardPage() {
  const { current, resetStack } = useNavigationStore();
  const [tableOpen, setTableOpen] = useState(false);

  useEffect(() => {
    resetStack({ module: 'dashboard', subView: 'list' });
  }, [resetStack]);

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

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">Dashboard</h1>
        <p className="mt-0.5 text-sm text-[var(--ink-light)]">
          Live overview of ticket health across projects and centres.
        </p>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <DashboardFilters />

      {/* ── Summary row ────────────────────────────────────────────────────── */}
      <SummaryCards />

      {/* ── Chart row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <AggregationChart />
        <StatusDonutChart />
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
            <DashboardTicketTable />
          </div>
        )}
      </div>

      <TicketStatusDialog />
    </div>
  );
}
