import { useEffect }                from 'react';
import { ClipboardList }            from 'lucide-react';
import { MyWorkFilters }            from '../modules/my-work/components/MyWorkFilters';
import { MyWorkTabs }               from '../modules/my-work/components/MyWorkTabs';
import { MyWorkTable }              from '../modules/my-work/components/MyWorkTable';
import { TicketDetail }             from '../modules/tickets/components/TicketDetail';
import { TicketStatusDialog }       from '../modules/tickets/components/TicketStatusDialog';
import { useMyWorkStore }           from '../modules/my-work/store';
import type { MyWorkTab }           from '../modules/my-work/store';
import { useNavigationStore }       from '../store/navigationStore';
import { useAuthStore }             from '../store/authStore';
import { cn }                       from '../utils';

// ── Work-tab config ───────────────────────────────────────────────────────────

const WORK_TABS: { key: MyWorkTab; label: string }[] = [
  { key: 'ASSIGNED', label: 'Assigned to Me' },
  { key: 'RAISED',   label: 'Raised by Me'   },
  { key: 'MY_TEAM',  label: 'My Team'        },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function MyWorkPage() {
  const { current, resetStack } = useNavigationStore();
  const { workTab, setWorkTab }          = useMyWorkStore();
  const username                         = useAuthStore((s) => s.user?.username ?? '');

  useEffect(() => {
    resetStack({ module: 'my-work', subView: 'list' });
  }, [resetStack]);

  // ── Ticket Detail sub-view ─────────────────────────────────────────────────

  const isDetail =
    current?.module   === 'my-work' &&
    current?.subView  === 'detail'  &&
    !!current?.selectedId;

  if (isDetail) {
    return (
      <>
        <TicketDetail ticketId={current!.selectedId as string} />
        <TicketStatusDialog />
      </>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. Title card ───────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-4
                      flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-[10px] bg-[var(--sage-light)] border border-[var(--sage)]/20
                          flex items-center justify-center mt-0.5">
            <ClipboardList size={16} className="text-[var(--sage)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">My Work</h1>
            <p className="mt-0.5 text-sm text-[var(--ink-light)]">
              Quick access to your assigned and created tickets.
            </p>
          </div>
        </div>

        {/* Work-tab switcher */}
        <div className="flex items-center gap-1 p-1 shrink-0
                        bg-[var(--ghost)] border border-[var(--border)] rounded-[10px]">
          {WORK_TABS.map((tab) => {
            const active = workTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setWorkTab(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all duration-150',
                  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
                  active
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--ink-light)] hover:text-[var(--ink)]',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Filters card ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-3">
        <MyWorkFilters />
      </div>

      {/* ── 3. Table card ───────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden flex flex-col">
        {/* Status tabs */}
        <div className="px-4 pt-3 pb-0 border-b border-[var(--border)]">
          <MyWorkTabs />
        </div>
        {/* Table */}
        <MyWorkTable username={username} flat />
      </div>

      <TicketStatusDialog />
    </div>
  );
}
