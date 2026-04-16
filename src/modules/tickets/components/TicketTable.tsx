import { useState }                   from 'react';
import { Eye, RefreshCw,
         ChevronLeft, ChevronRight,
         Pencil, Clock, Download }    from 'lucide-react';
import { TicketExportDialog }         from './TicketExportDialog';
import { TicketStatusBadge }          from './TicketStatusBadge';
import { Button }                     from '../../../components/ui/Button';
import { Select }                     from '../../../components/ui/Select';
import { Spinner }                    from '../../../components/ui/Spinner';
import { cn, formatLocalDateTime,
         formatDuration, truncate,
         formatActiveDuration }       from '../../../utils';
import { useNavigationStore }         from '../../../store/navigationStore';
import { useAuthStore }               from '../../../store/authStore';
import { useTickets }                 from '../hooks';
import { useTicketStore }             from '../store';
import {
  TAB_STATUSES,
  STATUS_TRANSITIONS,
}                                     from '../../../services/ticket.service';
import type { TicketResponse }        from '../../../services/ticket.service';

// ── Escalation helpers ────────────────────────────────────────────────────────

function isEscalated(level: string | null | undefined): boolean {
  return !!level && level !== 'NONE';
}

function EscalationChip({ level }: { level: string }) {
  const isL2 = level === 'L2';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.58rem] font-bold px-1.5 py-0.5
                       rounded-[5px] border uppercase tracking-wide leading-none
                       ${isL2
                         ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
                         : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'}`}>
      ⚠ {level}
    </span>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [
  { value: '10',   label: '10 / page'   },
  { value: '20',   label: '20 / page'   },
  { value: '50',   label: '50 / page'   },
  { value: '100',  label: '100 / page'  },
  { value: '500',  label: '500 / page'  },
  { value: '1000', label: '1000 / page' },
];

// ── Mobile card ───────────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  canUpdate,
  onView,
  onUpdateStatus,
}: {
  ticket: TicketResponse;
  canUpdate: boolean;
  onView: () => void;
  onUpdateStatus: () => void;
}) {

  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-4 flex flex-col gap-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.68rem] font-mono text-[var(--ink-light)]">#{ticket.id}</p>
          <p className="text-sm font-semibold text-[var(--ink)] mt-0.5">
            {ticket.project.projectCode} · {ticket.center.centerCode}
          </p>
          <p className="text-xs text-[var(--ink-light)]">{ticket.center.centerName}</p>
          {/* Active duration + escalation */}
          {(ticket.activeSince || isEscalated(ticket.escalationLevel)) && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {formatActiveDuration(ticket.activeSince, ticket.activeEndedAt) && (
                <span className="text-xs font-semibold text-[var(--ink)] tabular-nums">
                  {formatActiveDuration(ticket.activeSince, ticket.activeEndedAt)}
                </span>
              )}
              {isEscalated(ticket.escalationLevel) && (
                <EscalationChip level={ticket.escalationLevel!} />
              )}
            </div>
          )}
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      {/* Service + Escalation */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[0.68rem] px-2 py-0.5 rounded-md bg-[var(--sage-light)] text-[var(--sage)] font-semibold">
          {ticket.serviceName}
        </span>
        <span className="text-[0.68rem] px-2 py-0.5 rounded-md bg-[var(--ghost)] border border-[var(--border)] text-[var(--ink-mid)]">
          {ticket.escalationType}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--ink-mid)] line-clamp-2">{ticket.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
        <span className="text-[0.65rem] text-[var(--ink-light)]">
          {formatLocalDateTime(ticket.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUpdateStatus}
              leftIcon={<Pencil size={12} />}
            >
              Update
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            leftIcon={<Eye size={12} />}
          >
            View
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketTable({ flat = false }: { flat?: boolean }) {
  const {
    activeTab, filters, pagination,
    setPage, setSize, openStatusDialog,
  } = useTicketStore();

  const { pushView }  = useNavigationStore();
  const user          = useAuthStore((s) => s.user);
  const [refetchKey,  setRefetchKey]  = useState(0);
  const [exportOpen,  setExportOpen]  = useState(false);

  const projectCode = typeof filters.projectCode === 'string' ? filters.projectCode : '';
  const centerCodes = Array.isArray(filters.centerCodes) ? filters.centerCodes : [];
  const services    = Array.isArray(filters.services)    ? filters.services    : [];

  const queryParams = {
    page:      pagination.page,
    size:      pagination.size,
    statuses:  TAB_STATUSES[activeTab].join(','),
    ...(projectCode           && { projectCodes: projectCode }),
    ...(filters.search        && { search:       filters.search }),
    ...(centerCodes.length    && { centerCodes:  centerCodes.join(',') }),
    ...(services.length       && { services:     services.join(',') }),
    _k: refetchKey,
  };

  // Don't fetch until a project is selected
  const { data, isLoading, isFetching, refetch } = useTickets(
    queryParams as Parameters<typeof useTickets>[0],
  );

  const rows          = data?.content       ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages    = data?.totalPages    ?? 1;
  const displayPage   = pagination.page + 1;

  function viewDetail(t: TicketResponse) {
    pushView({ module: 'tickets', subView: 'detail', selectedId: t.id });
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

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
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 0}
            className="w-7 h-7 flex items-center justify-center rounded-[8px]
                       text-[var(--ink-light)] hover:bg-[var(--ghost)]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="w-7 text-center text-xs text-[var(--ink-light)]">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage((p as number) - 1)}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-[8px] text-xs font-medium transition-colors',
                  p === displayPage
                    ? 'bg-[var(--sage-light)] text-[var(--sage)] font-semibold'
                    : 'text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
                )}
              >
                {p}
              </button>
            ),
          )}
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-[8px]
                       text-[var(--ink-light)] hover:bg-[var(--ghost)]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Table header ───────────────────────────────────────────────────────────

  const TH = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <th
      className={cn(
        'px-3 py-2.5 border-b border-[var(--border)] text-left whitespace-nowrap',
        'text-[0.6rem] font-semibold uppercase tracking-[0.05em] text-[var(--ink-light)]',
        className,
      )}
    >
      {children}
    </th>
  );

  const TD = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={cn('px-3 py-3 text-sm text-[var(--ink-mid)] align-top', className)}>
      {children}
    </td>
  );

  // ── Skeleton rows ─────────────────────────────────────────────────────────

  function SkeletonRow() {
    return (
      <tr className="border-t border-[var(--border)]">
        {Array.from({ length: 16 }).map((_, i) => (
          <td key={i} className="px-3 py-3">
            <div
              className="h-3 rounded-md"
              style={{
                width: `${50 + (i % 4) * 12}%`,
                background: `linear-gradient(90deg, var(--border) 25%, var(--ghost) 50%, var(--border) 75%)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.6s infinite',
              }}
            />
          </td>
        ))}
      </tr>
    );
  }

  // ── No project selected guard ───────────────────────────────────────────────

  if (!projectCode) {
    return (
      <div className={cn(
        'flex flex-col items-center gap-3 py-16 text-center',
        !flat && 'bg-[var(--surface)] border border-[var(--border)] rounded-[14px]',
      )}>
        <div className="w-12 h-12 rounded-[14px] bg-[var(--ghost)] border border-[var(--border)]
                        flex items-center justify-center">
          <Clock size={20} className="text-[var(--ink-light)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Select a project</p>
          <p className="text-xs text-[var(--ink-light)] mt-1">
            Choose a project from the filter above to view tickets.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pt-3 flex-wrap gap-2">
        <p className="text-xs text-[var(--ink-light)]">
          {isLoading
            ? 'Loading…'
            : `${totalElements} ticket${totalElements !== 1 ? 's' : ''}`}
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

      {/* ── Mobile: card layout ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-[14px] bg-[var(--ghost)] border border-[var(--border)]"
                style={{ animation: 'shimmer 1.6s infinite' }}
              />
            ))
          : rows.length === 0
            ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Clock size={32} className="text-[var(--ink-light)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">No tickets found</p>
                  <p className="text-xs text-[var(--ink-light)] mt-1">
                    No tickets match your current filters.
                  </p>
                </div>
              </div>
            )
            : rows.map((t: TicketResponse) => {
                const isAdmin    = user?.role?.toUpperCase() === 'ADMIN';
                const isAssigned = t.assignedTo?.username === user?.username;
                const canUpdate  = !!STATUS_TRANSITIONS[t.status] && (isAdmin || isAssigned);
                return (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    canUpdate={canUpdate}
                    onView={() => viewDetail(t)}
                    onUpdateStatus={() => openStatusDialog(t.id)}
                  />
                );
              })}
      </div>

      {/* ── Desktop: table ──────────────────────────────────────────────────── */}
      <div className={cn(
        'hidden sm:block overflow-hidden',
        !flat && 'bg-[var(--surface)] border border-[var(--border)] rounded-[14px]',
      )}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '1400px' }}>
            <thead>
              <tr className="bg-[var(--ghost)]">
                <TH>Ticket No.</TH>
                <TH>Active / Level</TH>
                <TH>Date & Time</TH>
                <TH>Project</TH>
                <TH>Center Code</TH>
                <TH>Center Name</TH>
                <TH>State</TH>
                <TH>City</TH>
                <TH>Service</TH>
                <TH>Escalation</TH>
                <TH>Requested By</TH>
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
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : rows.length === 0
                  ? (
                    <tr>
                      <td colSpan={17}>
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                          <div className="w-12 h-12 rounded-[14px] bg-[var(--ghost)] border
                                          border-[var(--border)] flex items-center justify-center">
                            <Clock size={20} className="text-[var(--ink-light)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">No tickets found</p>
                            <p className="text-xs text-[var(--ink-light)] mt-1">
                              No tickets match your current filters.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                  : rows.map((t: TicketResponse) => {
                      const isAdmin    = user?.role?.toUpperCase() === 'ADMIN';
                      const isAssigned = t.assignedTo?.username === user?.username;
                      const canUpdate  = !!STATUS_TRANSITIONS[t.status] && (isAdmin || isAssigned);
                      const escalated  = isEscalated(t.escalationLevel);
                      return (
                        <tr
                          key={t.id}
                          onClick={() => viewDetail(t)}
                          className={cn(
                            'border-t border-[var(--border)] transition-colors cursor-pointer',
                            escalated
                              ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7]'
                              : 'hover:bg-[var(--ghost)]',
                          )}
                        >
                          <TD>
                            <span className="font-mono text-xs text-[var(--ink)] font-semibold">
                              #{t.id}
                            </span>
                          </TD>
                          {/* Active Duration + Escalation Level */}
                          <TD>
                            <div className="flex flex-col gap-1">
                              {(() => {
                                const dur = formatActiveDuration(t.activeSince, t.activeEndedAt);
                                return dur ? (
                                  <span className="text-xs font-semibold text-[var(--ink)] tabular-nums">
                                    {dur}
                                  </span>
                                ) : (
                                  <span className="text-xs text-[var(--ink-light)]">—</span>
                                );
                              })()}
                              {isEscalated(t.escalationLevel) && (
                                <EscalationChip level={t.escalationLevel!} />
                              )}
                            </div>
                          </TD>
                          <TD>
                            <span className="text-xs whitespace-nowrap">
                              {formatLocalDateTime(t.createdAt)}
                            </span>
                          </TD>
                          <TD>
                            <span className="font-mono text-xs px-2 py-0.5 rounded-md
                                             bg-[var(--sage-light)] text-[var(--sage)] font-semibold
                                             whitespace-nowrap">
                              {t.project.projectCode}
                            </span>
                          </TD>
                          <TD>
                            <span className="font-mono text-xs">{t.center.centerCode}</span>
                          </TD>
                          <TD>
                            <span className="text-xs whitespace-nowrap">{t.center.centerName}</span>
                          </TD>
                          <TD>
                            <span className="text-xs">{t.center.state || '—'}</span>
                          </TD>
                          <TD>
                            <span className="text-xs">{t.center.city || '—'}</span>
                          </TD>
                          <TD>
                            <span className="text-xs px-2 py-0.5 rounded-md
                                             bg-[var(--ghost)] border border-[var(--border)]
                                             whitespace-nowrap">
                              {t.serviceName}
                            </span>
                          </TD>
                          <TD>
                            <span className="text-xs whitespace-nowrap">{t.escalationType}</span>
                          </TD>
                          <TD>
                            {t.creator ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium text-[var(--ink)]">
                                  {t.creator.fullName}
                                </span>
                                <span className="text-[0.65rem] text-[var(--ink-light)]">
                                  {t.creator.username}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--ink-light)]">—</span>
                            )}
                          </TD>
                          <TD className="max-w-[200px]">
                            <span
                              className="text-xs block truncate"
                              title={t.description}
                            >
                              {t.description}
                            </span>
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
                              {t.totalDurationInMinutes != null
                                ? formatDuration(t.totalDurationInMinutes)
                                : '—'}
                            </span>
                          </TD>
                          <TD className="text-right pr-4">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {canUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openStatusDialog(t.id)}
                                  leftIcon={<Pencil size={12} />}
                                >
                                  Update
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDetail(t)}
                                leftIcon={<Eye size={12} />}
                              >
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

      {/* Mobile pagination */}
      {totalElements > 0 && (
        <div className="sm:hidden flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 0}
            onClick={() => setPage(pagination.page - 1)}
          >
            Prev
          </Button>
          <span className="text-xs text-[var(--ink-light)]">
            {displayPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= totalPages - 1}
            onClick={() => setPage(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <TicketExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        rows={rows}
        context={`tickets_${activeTab}`}
      />
    </div>
  );
}
