import { useState }               from 'react';
import { Eye, RefreshCw,
         ChevronLeft, ChevronRight,
         Pencil, Clock, Download } from 'lucide-react';
import { TicketExportDialog }      from '../../tickets/components/TicketExportDialog';
import { TicketStatusBadge }       from '../../tickets/components/TicketStatusBadge';
import { Button }                  from '../../../components/ui/Button';
import { Select }                  from '../../../components/ui/Select';
import { Spinner }                 from '../../../components/ui/Spinner';
import { cn, formatLocalDateTime,
         formatDuration,
         formatActiveDuration }    from '../../../utils';
import { useNavigationStore }      from '../../../store/navigationStore';
import { useTickets }              from '../../tickets/hooks';
import { useDashboardStore }       from '../store';
import { useAuthStore }            from '../../../store/authStore';
import {
  TAB_STATUSES,
  STATUS_TRANSITIONS,
}                                  from '../../../services/ticket.service';
import type { TicketResponse }     from '../../../services/ticket.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [
  { value: '10',   label: '10 / page'   },
  { value: '20',   label: '20 / page'   },
  { value: '50',   label: '50 / page'   },
  { value: '100',  label: '100 / page'  },
  { value: '500',  label: '500 / page'  },
  { value: '1000', label: '1000 / page' },
];

function isEscalated(level: string | null | undefined) {
  return !!level && level !== 'NONE';
}

function EscalationChip({ level }: { level: string }) {
  const isL2 = level === 'L2';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.58rem] font-bold px-1.5 py-0.5
                       rounded-[5px] border uppercase tracking-wide leading-none
                       ${isL2 ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
                               : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'}`}>
      ⚠ {level}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardTicketTable({ flat = false }: { flat?: boolean }) {
  const {
    filters, activeTab, pagination, setPage, setSize,
  } = useDashboardStore();

  const user     = useAuthStore((s) => s.user);
  const isClient = user?.role?.toUpperCase() === 'CLIENT';

  const { pushView }                = useNavigationStore();
  const [refetchKey,  setRefetchKey]  = useState(0);
  const [exportOpen,  setExportOpen]  = useState(false);

  const { projectCode, services, escalationTypes, centreCodes } = filters;

  const queryParams = {
    page:     pagination.page,
    size:     pagination.size,
    statuses: TAB_STATUSES[activeTab].join(','),
    ...(projectCode          && { projectCodes:     projectCode            }),
    ...(services.length      && { services:         services.join(',')     }),
    ...(escalationTypes.length && { escalationTypes: escalationTypes.join(',') }),
    ...(centreCodes.length   && { centerCodes:      centreCodes.join(',')  }),
    _k: refetchKey,
  };

  const { data, isLoading, isFetching, refetch } =
    useTickets(queryParams as Parameters<typeof useTickets>[0]);

  const rows          = data?.content       ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages    = data?.totalPages    ?? 1;
  const displayPage   = pagination.page + 1;

  if (!projectCode) return null;

  // ── TH / TD ──────────────────────────────────────────────────────────────────

  const TH = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <th className={cn(
      'px-3 py-2.5 border-b border-[var(--border)] text-left whitespace-nowrap',
      'text-[0.6rem] font-semibold uppercase tracking-[0.05em] text-[var(--ink-light)]',
      className,
    )}>
      {children}
    </th>
  );

  const TD = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={cn('px-3 py-3 text-sm text-[var(--ink-mid)] align-top', className)}>
      {children}
    </td>
  );

  // ── Pagination bar ────────────────────────────────────────────────────────────

  function PaginationBar() {
    const pages: (number | '…')[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - displayPage) <= 1) pages.push(p);
      else if (pages.at(-1) !== '…') pages.push('…');
    }
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3
                      px-4 py-3 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--ink-light)]">
          {totalElements === 0
            ? '0 results'
            : `${pagination.page * pagination.size + 1}–${Math.min(
                (pagination.page + 1) * pagination.size, totalElements,
              )} of ${totalElements}`}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(pagination.page - 1)}
                  disabled={pagination.page <= 0}
                  className="w-7 h-7 flex items-center justify-center rounded-[8px]
                             text-[var(--ink-light)] hover:bg-[var(--ghost)]
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={14} />
          </button>
          {pages.map((p, i) =>
            p === '…'
              ? <span key={`e-${i}`} className="w-7 text-center text-xs text-[var(--ink-light)]">…</span>
              : <button key={p}
                        onClick={() => setPage((p as number) - 1)}
                        className={cn(
                          'w-7 h-7 flex items-center justify-center rounded-[8px] text-xs font-medium',
                          p === displayPage
                            ? 'bg-[var(--sage-light)] text-[var(--sage)] font-semibold'
                            : 'text-[var(--ink-light)] hover:bg-[var(--ghost)]',
                        )}>
                  {p}
                </button>,
          )}
          <button onClick={() => setPage(pagination.page + 1)}
                  disabled={pagination.page >= totalPages - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-[8px]
                             text-[var(--ink-light)] hover:bg-[var(--ghost)]
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-0.5">
        <p className="text-xs text-[var(--ink-light)]">
          {isLoading ? 'Loading…' : `${totalElements} ticket${totalElements !== 1 ? 's' : ''}`}
          {isFetching && !isLoading && (
            <span className="ml-2 inline-flex items-center gap-1 text-[#3B82F6]">
              <Spinner size="sm" /> refreshing
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={13} />}
            onClick={() => setExportOpen(true)}
            disabled={rows.length === 0}
            title="Export to Excel"
          >
            Export
          </Button>
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pagination.size)}
            onChange={(v) => setSize(Number(v))}
            wrapClass="w-32"
            size="sm"
          />
          <button
            onClick={() => { setRefetchKey((k) => k + 1); refetch(); }}
            title="Refresh"
            className="h-8 w-8 flex items-center justify-center rounded-[8px]
                       border border-[var(--border)] bg-[var(--ghost)]
                       text-[#3B82F6] hover:border-[#3B82F6] hover:bg-[#EFF6FF]
                       transition-colors duration-150 disabled:opacity-40"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={cn(
        'overflow-hidden',
        !flat && 'bg-[var(--surface)] border border-[var(--border)] rounded-[14px]',
      )}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '1100px' }}>
            <thead>
              <tr className="bg-[var(--ghost)]">
                <TH>Ticket No.</TH>
                {!isClient && <TH>Active / Level</TH>}
                <TH>Date & Time</TH>
                <TH>Centre Code</TH>
                <TH>Centre Name</TH>
                <TH>City</TH>
                <TH>State</TH>
                <TH>Service</TH>
                {!isClient && <TH>Escalation</TH>}
                <TH>Raised By</TH>
                <TH>Description</TH>
                <TH>Status</TH>
                <TH className="min-w-[12rem]">Resolved By</TH>
                <TH>Resolved At</TH>
                <TH>Duration</TH>
                <TH className="text-right pr-4">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      {Array.from({ length: isClient ? 14 : 16 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-3 rounded-md"
                               style={{
                                 width: `${50 + (j % 4) * 12}%`,
                                 background: 'linear-gradient(90deg,var(--border) 25%,var(--ghost) 50%,var(--border) 75%)',
                                 backgroundSize: '200% 100%',
                                 animation: 'shimmer 1.6s infinite',
                               }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                  ? (
                    <tr>
                      <td colSpan={isClient ? 14 : 16}>
                        <div className="flex flex-col items-center gap-3 py-14 text-center">
                          <div className="w-10 h-10 rounded-[12px] bg-[var(--ghost)] border border-[var(--border)]
                                          flex items-center justify-center">
                            <Clock size={18} className="text-[var(--ink-light)]" />
                          </div>
                          <p className="text-sm font-semibold text-[var(--ink)]">No tickets found</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : rows.map((t: TicketResponse) => {
                      const canUpdate = !!STATUS_TRANSITIONS[t.status];
                      const escalated = !isClient && isEscalated(t.escalationLevel);
                      const dur       = formatActiveDuration(t.activeSince, t.activeEndedAt);
                      return (
                        <tr
                          key={t.id}
                          onClick={() => pushView({ module: 'tickets', subView: 'detail', selectedId: t.id })}
                          className={cn(
                            'border-t border-[var(--border)] cursor-pointer transition-colors',
                            escalated ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7]' : 'hover:bg-[var(--ghost)]',
                          )}
                        >
                          <TD>
                            <span className="font-mono text-xs text-[var(--ink)] font-semibold">
                              #{t.id}
                            </span>
                          </TD>
                          {!isClient && (
                            <TD>
                              <div className="flex flex-col gap-1">
                                {dur
                                  ? <span className="text-xs font-semibold text-[var(--ink)] tabular-nums">{dur}</span>
                                  : <span className="text-xs text-[var(--ink-light)]">—</span>}
                                {escalated && <EscalationChip level={t.escalationLevel!} />}
                              </div>
                            </TD>
                          )}
                          <TD>
                            <span className="text-xs whitespace-nowrap">{formatLocalDateTime(t.createdAt)}</span>
                          </TD>
                          <TD>
                            <span className="font-mono text-xs">{t.center.centerCode}</span>
                          </TD>
                          <TD>
                            <span className="text-xs whitespace-nowrap">{t.center.centerName}</span>
                          </TD>
                          <TD>
                            <span className="text-xs whitespace-nowrap">{t.center.city || '—'}</span>
                          </TD>
                          <TD>
                            <span className="text-xs">{t.center.state || '—'}</span>
                          </TD>
                          <TD>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--ghost)]
                                             border border-[var(--border)] whitespace-nowrap">
                              {t.serviceName}
                            </span>
                          </TD>
                          {!isClient && (
                            <TD>
                              <span className="text-xs whitespace-nowrap">{t.escalationType}</span>
                            </TD>
                          )}
                          <TD>
                            {t.creator
                              ? <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium text-[var(--ink)]">{t.creator.fullName}</span>
                                  <span className="text-[0.65rem] text-[var(--ink-light)]">{t.creator.username}</span>
                                </div>
                              : <span className="text-xs text-[var(--ink-light)]">—</span>}
                          </TD>
                          <TD className="max-w-[180px]">
                            <span className="text-xs block truncate" title={t.description}>{t.description}</span>
                          </TD>
                          <TD>
                            <TicketStatusBadge status={t.status} />
                          </TD>
                          <TD className="min-w-[12rem]">
                            {t.resolvedBy
                              ? <span className="text-xs text-[var(--ink)] font-mono whitespace-nowrap">{t.resolvedBy}</span>
                              : <span className="text-xs text-[var(--ink-light)]">—</span>}
                          </TD>
                          <TD>
                            <span className="text-xs whitespace-nowrap">
                              {t.resolvedAt ? formatLocalDateTime(t.resolvedAt) : '—'}
                            </span>
                          </TD>
                          <TD>
                            <span className="font-mono text-xs">
                              {t.totalDurationInMinutes != null ? formatDuration(t.totalDurationInMinutes) : '—'}
                            </span>
                          </TD>
                          <TD className="text-right pr-4">
                            <div className="flex items-center justify-end gap-1"
                                 onClick={(e) => e.stopPropagation()}>
                              {canUpdate && (
                                <Button variant="ghost" size="sm"
                                        onClick={() => pushView({ module: 'tickets', subView: 'detail', selectedId: t.id })}
                                        leftIcon={<Pencil size={12} />}>
                                  Update
                                </Button>
                              )}
                              <Button variant="ghost" size="sm"
                                      onClick={() => pushView({ module: 'tickets', subView: 'detail', selectedId: t.id })}
                                      leftIcon={<Eye size={12} />}>
                                View
                              </Button>
                            </div>
                          </TD>
                        </tr>
                      );
                    })}
            </tbody>
          </table>
        </div>
        {totalElements > 0 && <PaginationBar />}
      </div>

      <TicketExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        rows={rows}
        context={`dashboard_tickets_${activeTab}`}
      />
    </div>
  );
}
