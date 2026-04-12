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
    <div className="flex flex-col gap-5">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:gap-0">
        {/* Title row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">Tickets</h1>
            <p className="mt-0.5 text-sm text-[var(--ink-light)]">
              Manage and track service escalation tickets.
            </p>
          </div>

          {/* Desktop: summary chips + raise button in one row */}
          <div className="hidden sm:flex items-center gap-2">
            <TicketSummaryBar />
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            <Button onClick={openCreate} leftIcon={<Plus size={15} />}>
              Raise Ticket
            </Button>
          </div>

          {/* Mobile: just the raise button */}
          <div className="sm:hidden">
            <Button onClick={openCreate} leftIcon={<Plus size={15} />} size="sm">
              Raise Ticket
            </Button>
          </div>
        </div>

        {/* Mobile: summary chips on their own row */}
        <div className="sm:hidden">
          <TicketSummaryBar />
        </div>
      </div>

      {/* Status tabs */}
      <TicketTabs />

      {/* Filters */}
      <TicketFilters />

      {/* Table */}
      <TicketTable />

      {/* Modals */}
      <TicketForm />
      <TicketStatusDialog />
    </div>
  );
}
