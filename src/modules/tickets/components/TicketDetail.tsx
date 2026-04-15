import { useState, useRef, useEffect }  from 'react';
import { ArrowLeft, Pencil, Paperclip,
         User, Clock, Download,
         MapPin, Layers, CheckCircle2,
         Tag, Check, X, AlertTriangle } from 'lucide-react';
import { Button }                        from '../../../components/ui/Button';
import { Spinner }                       from '../../../components/ui/Spinner';
import { TicketStatusBadge }             from './TicketStatusBadge';
import { TicketTimeline }                from './TicketTimeline';
import { useNavigationStore }            from '../../../store/navigationStore';
import { useTicketStore }                from '../store';
import { useTicketById,
         useUpdateTicketDescription }    from '../hooks';
import { STATUS_TRANSITIONS }            from '../../../services/ticket.service';
import { formatLocalDateTime,
         formatDuration }                from '../../../utils';
import { useAuthStore }                  from '../../../store/authStore';
import type { UserMiniDto,
              Attachment }               from '../../../services/ticket.service';

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)] mb-3">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
      {children}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <FieldLabel>{label}</FieldLabel>
      <span className="text-sm text-[var(--ink)]">{value ?? '—'}</span>
    </div>
  );
}

function UserCard({ user, label }: { user: UserMiniDto | null; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      {user ? (
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-6 h-6 rounded-full bg-[var(--sage-light)] flex items-center justify-center shrink-0">
            <User size={11} className="text-[var(--sage)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ink)] leading-tight">{user.fullName}</p>
            <p className="text-[0.62rem] text-[var(--ink-light)]">@{user.username} · {user.contact}</p>
          </div>
        </div>
      ) : (
        <span className="text-sm text-[var(--ink-light)]">—</span>
      )}
    </div>
  );
}

function AttachmentRow({ att }: { att: Attachment }) {
  const humanSize = (b: number) =>
    b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-[8px]
                    bg-[var(--ghost)] border border-[var(--border)] group">
      <Paperclip size={12} className="text-[var(--ink-light)] shrink-0" />
      <span className="flex-1 text-xs text-[var(--ink)] truncate">{att.fileName}</span>
      <span className="text-[0.62rem] text-[var(--ink-light)] shrink-0">{humanSize(att.fileSize)}</span>
      <a
        href={att.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Download"
        className="p-1 rounded text-[var(--ink-light)] group-hover:text-[var(--sage)]
                   hover:bg-[var(--border)] transition-colors"
      >
        <Download size={11} />
      </a>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 ${className ?? ''}`}>
      {children}
    </div>
  );
}

// ── Description card with inline edit ────────────────────────────────────────

function DescriptionCard({
  ticketId, description, editable,
}: {
  ticketId: string; description: string; editable: boolean;
}) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(description);
  const [apiError, setApiError] = useState<string | null>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);
  const updateMut               = useUpdateTicketDescription();

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(description);
    setApiError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setApiError(null);
  }

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === description) { cancel(); return; }
    setApiError(null);
    try {
      await updateMut.mutateAsync({ id: ticketId, description: trimmed });
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message
        ?? 'Failed to update description.';
      setApiError(msg);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Description</SectionLabel>
        {editable && !editing && (
          <button
            onClick={startEdit}
            className="p-1 rounded-[6px] text-[var(--ink-light)] hover:text-[var(--ink)]
                       hover:bg-[var(--ghost)] transition-colors"
            title="Edit description"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-[10px] border border-[var(--sage)] bg-[var(--ghost)]
                       px-3 py-2 text-sm text-[var(--ink)] resize-none outline-none
                       placeholder:text-[var(--ink-light)] transition-colors duration-150"
          />
          {apiError && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-[8px]
                            bg-[#FEF2F2] border border-[#FECACA]">
              <span className="text-[#DC2626] shrink-0 text-sm leading-none">✕</span>
              <p className="text-xs text-[#DC2626]">{apiError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={cancel}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-xs
                         text-[var(--ink-mid)] hover:bg-[var(--ghost)] transition-colors"
            >
              <X size={11} /> Cancel
            </button>
            <button
              onClick={save}
              disabled={updateMut.isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-xs
                         bg-[var(--sage)] text-white hover:opacity-90 transition-opacity
                         disabled:opacity-50"
            >
              {updateMut.isPending ? <Spinner size="xs" /> : <Check size={11} />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      )}
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const { popView }          = useNavigationStore();
  const { openStatusDialog } = useTicketStore();
  const { user }             = useAuthStore();
  const { data: ticket, isLoading, isError } = useTicketById(ticketId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-[var(--ink-mid)]">Failed to load ticket.</p>
        <Button variant="outline" size="sm" onClick={popView}>Go back</Button>
      </div>
    );
  }

  const canUpdate = !!STATUS_TRANSITIONS[ticket.status];
  const isCreator = !!user && !!ticket.creator && user.username === ticket.creator.username;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={popView}
          className="p-1.5 rounded-[8px] text-[var(--ink-light)] hover:bg-[var(--ghost)]
                     hover:text-[var(--ink)] transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-mono text-xs text-[var(--ink-light)]">#{ticket.id}</span>
        <TicketStatusBadge status={ticket.status} />
        <span className="text-[0.65rem] text-[var(--ink-light)]">
          {formatLocalDateTime(ticket.createdAt)}
        </span>
        <div className="flex-1" />
        {canUpdate && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Pencil size={12} />}
            onClick={() => openStatusDialog(ticket.id)}
          >
            Update Status
          </Button>
        )}
      </div>

      {/* ── Title + chips ──────────────────────────────────────────────────── */}
      <Card className="!py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-[var(--ink)] leading-snug">
              {ticket.center.centerName}
            </p>
            {(ticket.center.city || ticket.center.state) && (
              <p className="flex items-center gap-1 text-xs text-[var(--ink-light)] mt-0.5">
                <MapPin size={11} />
                {[ticket.center.city, ticket.center.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px]
                             bg-[var(--sage-light)] text-[var(--sage)] text-[0.65rem] font-semibold font-mono
                             border border-[var(--sage-mid)]">
              <Layers size={10} />
              {ticket.project.projectCode}
            </span>
            <span className="px-2 py-1 rounded-[6px] bg-[var(--ghost)] border border-[var(--border)]
                             text-[0.65rem] font-mono text-[var(--ink-mid)]">
              {ticket.center.centerCode}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px]
                             bg-[var(--ghost)] border border-[var(--border)] text-[0.65rem] text-[var(--ink-mid)]">
              <Tag size={10} />
              {ticket.serviceName}
            </span>
            <span className="px-2 py-1 rounded-[6px] bg-[var(--ghost)] border border-[var(--border)]
                             text-[0.65rem] text-[var(--ink-mid)]">
              {ticket.escalationType}
            </span>
            {ticket.totalDurationInMinutes != null && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px]
                               bg-[var(--ghost)] border border-[var(--border)] text-[0.65rem] text-[var(--ink-mid)]">
                <Clock size={10} />
                {formatDuration(ticket.totalDurationInMinutes)}
              </span>
            )}
            {ticket.escalationLevel && ticket.escalationLevel !== 'NONE' && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-[6px]
                               text-[0.65rem] font-bold border
                               ${ticket.escalationLevel === 'L2'
                                 ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
                                 : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'}`}>
                <AlertTriangle size={10} />
                {ticket.escalationLevel}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── Description ───────────────────────────────────────────────────── */}
      <DescriptionCard
        ticketId={ticket.id}
        description={ticket.description}
        editable={isCreator}
      />

      {/* ── People + Details row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* People */}
        <Card>
          <SectionLabel>People</SectionLabel>
          <div className="flex flex-col gap-5">
            <UserCard user={ticket.creator}    label="Raised By" />
            <UserCard user={ticket.assignedTo} label="Assigned To" />
          </div>
        </Card>

        {/* Centre + Project compact */}
        <Card>
          <SectionLabel>Details</SectionLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Centre Code" value={
              <span className="font-mono">{ticket.center.centerCode}</span>
            } />
            <Field label="Centre Name"  value={ticket.center.centerName} />
            <Field label="City"         value={ticket.center.city  || '—'} />
            <Field label="State"        value={ticket.center.state || '—'} />
            <Field label="Project Code" value={
              <span className="font-mono">{ticket.project.projectCode}</span>
            } />
            <Field label="Project Name" value={ticket.project.projectName} />
          </div>
        </Card>
      </div>

      {/* ── Resolution ────────────────────────────────────────────────────── */}
      {ticket.resolvedBy && (
        <Card>
          <SectionLabel>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-[#22C55E]" />
              Resolution
            </span>
          </SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div className="flex flex-col gap-1">
              <FieldLabel>Resolved By</FieldLabel>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-6 h-6 rounded-full bg-[var(--sage-light)] flex items-center justify-center shrink-0">
                  <User size={11} className="text-[var(--sage)]" />
                </div>
                <span className="text-sm font-mono text-[var(--ink)] break-all">{ticket.resolvedBy}</span>
              </div>
            </div>
            <Field
              label="Resolved At"
              value={ticket.resolvedAt ? formatLocalDateTime(ticket.resolvedAt) : '—'}
            />
            {ticket.resolvedRemarks && (
              <div className="sm:col-span-2 flex flex-col gap-1">
                <FieldLabel>Remarks</FieldLabel>
                <p className="text-sm text-[var(--ink)] whitespace-pre-wrap leading-relaxed mt-0.5">
                  {ticket.resolvedRemarks}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Attachments ───────────────────────────────────────────────────── */}
      {ticket.attachments?.length > 0 && (
        <Card>
          <SectionLabel>Attachments ({ticket.attachments.length})</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ticket.attachments.map((att, i) => (
              <AttachmentRow key={i} att={att} />
            ))}
          </div>
        </Card>
      )}

      {/* ── Activity Timeline ──────────────────────────────────────────────── */}
      <TicketTimeline ticketId={ticketId} />

    </div>
  );
}
