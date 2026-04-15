import { useEffect }           from 'react';
import { Plus }               from 'lucide-react';
import { Button }             from '../components/ui/Button';
import { TicketTabs }         from '../modules/tickets/components/TicketTabs';
import { TicketFilters }      from '../modules/tickets/components/TicketFilters';
import { TicketSummaryBar }   from '../modules/tickets/components/TicketSummaryBar';
import { TicketTable }        from '../modules/tickets/components/TicketTable';
import { TicketDetail }       from '../modules/tickets/components/TicketDetail';
import { TicketForm }         from '../modules/tickets/components/TicketForm';
import { TicketStatusDialog } from '../modules/tickets/components/TicketStatusDialog';
import { useNavigationStore } from '../store/navigationStore';
import { useTicketStore }     from '../modules/tickets/store';

export function TicketsPage() {
  const { current, resetStack } = useNavigationStore();
  const { openCreate }          = useTicketStore();

  useEffect(() => {
    resetStack({ module: 'tickets', subView: 'list' });
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

      {/* ── 1. Title card ───────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-4
                      flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">Tickets</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage and track service escalation tickets.
          </p>
        </div>

        {/* Summary chips + raise button */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <TicketSummaryBar />
          <div className="w-px h-5 bg-[var(--border)] mx-1 hidden sm:block" />
          <Button onClick={openCreate} leftIcon={<Plus size={14} />} size="sm">
            Raise Ticket
          </Button>
        </div>
      </div>

      {/* ── 2. Filters card ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-3">
        <TicketFilters />
      </div>

      {/* ── 3. Table card ───────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden flex flex-col">
        {/* Status tabs */}
        <div className="px-4 pt-3 pb-0 border-b border-[var(--border)]">
          <TicketTabs />
        </div>
        {/* Table */}
        <TicketTable flat />
      </div>

      {/* Modals */}
      <TicketForm />
      <TicketStatusDialog />
    </div>
  );
}
