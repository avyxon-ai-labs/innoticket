import { useEffect }           from 'react';
import { Plus }               from 'lucide-react';
import { Button }             from '../components/ui/Button';
import { TicketTabs }         from '../modules/tickets/components/TicketTabs';
import { TicketFilters }      from '../modules/tickets/components/TicketFilters';
import { TicketTable }        from '../modules/tickets/components/TicketTable';
import { TicketDetail }       from '../modules/tickets/components/TicketDetail';
import { TicketForm }         from '../modules/tickets/components/TicketForm';
import { TicketStatusDialog } from '../modules/tickets/components/TicketStatusDialog';
import { useNavigationStore } from '../store/navigationStore';
import { useTicketStore }     from '../modules/tickets/store';

export function TicketsPage() {
  const { current, resetStack } = useNavigationStore();
  const { openCreate }          = useTicketStore();

  // Seed the stack with the list root so popView() always has something to return to
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
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">Tickets</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage and track service escalation tickets.
          </p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={15} />}>
          Raise Ticket
        </Button>
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
