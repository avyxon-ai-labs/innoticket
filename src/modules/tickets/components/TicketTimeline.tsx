import { useState }               from 'react';
import { ChevronDown, ChevronUp,
         Activity, Paperclip,
         MessageSquare, User,
         GitBranch, CheckCircle2,
         XCircle, Clock, AlertCircle,
         FileText, RefreshCw,
         ArrowRight }             from 'lucide-react';
import { Spinner }                from '../../../components/ui/Spinner';
import { useTicketEvents }        from '../hooks';
import { formatLocalDateTime }    from '../../../utils';
import type { TicketEventType,
              TicketEventResponse } from '../../../services/ticket.service';

// ── Event config ──────────────────────────────────────────────────────────────

interface EventConfig {
  label: string;
  icon:  React.ReactNode;
  color: string;
  dotBg: string;
  ring:  string;
}

const EVENT_CONFIG: Record<TicketEventType, EventConfig> = {
  CREATED:             { label: 'Ticket Created',       icon: <Activity size={12} />,      color: 'text-[#3B82F6]', dotBg: 'bg-[#DBEAFE]', ring: 'border-[#BFDBFE]' },
  REOPENED:            { label: 'Ticket Reopened',      icon: <RefreshCw size={12} />,     color: 'text-[#3B82F6]', dotBg: 'bg-[#DBEAFE]', ring: 'border-[#BFDBFE]' },
  IN_PROGRESS:         { label: 'Moved to In Progress', icon: <Clock size={12} />,         color: 'text-[#3B82F6]', dotBg: 'bg-[#DBEAFE]', ring: 'border-[#BFDBFE]' },
  RESOLVED:            { label: 'Ticket Resolved',      icon: <CheckCircle2 size={12} />,  color: 'text-[#16A34A]', dotBg: 'bg-[#DCFCE7]', ring: 'border-[#BBF7D0]' },
  CLOSED:              { label: 'Ticket Closed',        icon: <CheckCircle2 size={12} />,  color: 'text-[#16A34A]', dotBg: 'bg-[#DCFCE7]', ring: 'border-[#BBF7D0]' },
  REJECTED:            { label: 'Ticket Rejected',      icon: <XCircle size={12} />,       color: 'text-[#EF4444]', dotBg: 'bg-[#FEE2E2]', ring: 'border-[#FECACA]' },
  WITHDRAWN:           { label: 'Ticket Withdrawn',     icon: <XCircle size={12} />,       color: 'text-[#EF4444]', dotBg: 'bg-[#FEE2E2]', ring: 'border-[#FECACA]' },
  ASSIGNED:            { label: 'Ticket Assigned',      icon: <User size={12} />,          color: 'text-[#EA580C]', dotBg: 'bg-[#FFEDD5]', ring: 'border-[#FED7AA]' },
  REASSIGNED:          { label: 'Ticket Reassigned',    icon: <User size={12} />,          color: 'text-[#EA580C]', dotBg: 'bg-[#FFEDD5]', ring: 'border-[#FED7AA]' },
  ESCALATED:           { label: 'Ticket Escalated',     icon: <AlertCircle size={12} />,   color: 'text-[#EA580C]', dotBg: 'bg-[#FFEDD5]', ring: 'border-[#FED7AA]' },
  COMMENTED:           { label: 'Comment Added',        icon: <MessageSquare size={12} />, color: 'text-[var(--ink-mid)]', dotBg: 'bg-[var(--ghost)]', ring: 'border-[var(--border)]' },
  ATTACHMENT_ADDED:    { label: 'Attachment Added',     icon: <Paperclip size={12} />,     color: 'text-[var(--ink-mid)]', dotBg: 'bg-[var(--ghost)]', ring: 'border-[var(--border)]' },
  DESCRIPTION_UPDATED: { label: 'Description Updated',  icon: <FileText size={12} />,      color: 'text-[var(--ink-mid)]', dotBg: 'bg-[var(--ghost)]', ring: 'border-[var(--border)]' },
};

const FALLBACK_CONFIG: EventConfig = {
  label: 'Event', icon: <GitBranch size={12} />,
  color: 'text-[var(--ink-mid)]', dotBg: 'bg-[var(--ghost)]', ring: 'border-[var(--border)]',
};

// ── Metadata block ────────────────────────────────────────────────────────────

// Keys that get rendered as prose blocks rather than pills
const PROSE_KEYS   = new Set(['comment', 'remarks', 'description', 'newDescription', 'oldDescription', 'message', 'reason']);
// Keys that map to human-friendly labels
const KEY_LABELS: Record<string, string> = {
  comment:         'Comment',
  remarks:         'Remarks',
  description:     'Description',
  oldDescription:  'Previous',
  newDescription:  'Updated',
  fileName:        'File',
  fileSize:        'Size',
  fileType:        'Type',
  fileUrl:         'URL',
  stage:           'Stage',
  toStatus:        'New Status',
  fromStatus:      'From Status',
  assigneeUsername:'Assignee',
  assigneeName:    'Assignee Name',
  message:         'Message',
  reason:          'Reason',
};

function humanSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MetaValue({ k, v }: { k: string; v: unknown }) {
  const label = KEY_LABELS[k] ?? k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

  // File size
  if (k === 'fileSize' && typeof v === 'number') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-[var(--ink-mid)]
                        px-2 py-1 rounded-[6px] bg-[var(--ghost)] border border-[var(--border)]">
        <span className="font-semibold text-[var(--ink-light)] uppercase tracking-wide">{label}</span>
        {humanSize(v)}
      </span>
    );
  }

  // Status transition arrow
  if ((k === 'fromStatus' || k === 'toStatus') && typeof v === 'string') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium
                        px-2 py-1 rounded-[6px] bg-[var(--ghost)] border border-[var(--border)]">
        <span className="text-[var(--ink-light)] uppercase tracking-wide text-[0.6rem]">{label}</span>
        <span className="font-semibold text-[var(--ink)] font-mono">{v}</span>
      </span>
    );
  }

  // Prose block (comments, remarks, descriptions)
  if (PROSE_KEYS.has(k) && typeof v === 'string') {
    return (
      <div className="w-full flex flex-col gap-1">
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
          {label}
        </span>
        <p className="text-xs text-[var(--ink)] leading-relaxed whitespace-pre-wrap
                      bg-[var(--ghost)] border border-[var(--border)] rounded-[8px] px-3 py-2">
          {v}
        </p>
      </div>
    );
  }

  // File URL — skip (not useful to display raw)
  if (k === 'fileUrl') return null;

  // Default pill
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.65rem]
                      px-2 py-1 rounded-[6px] bg-[var(--ghost)] border border-[var(--border)]">
      <span className="font-semibold text-[var(--ink-light)] uppercase tracking-wide text-[0.6rem]">{label}</span>
      <span className="text-[var(--ink)]">{String(v)}</span>
    </span>
  );
}

function EventMeta({ event }: { event: TicketEventResponse }) {
  const meta = event.metadata;
  if (!meta || Object.keys(meta).length === 0) return null;

  // Separate description update (show old → new side by side if both present)
  const isDescUpdate = event.eventType === 'DESCRIPTION_UPDATED'
    && ('oldDescription' in meta || 'newDescription' in meta);

  if (isDescUpdate) {
    const old_ = meta['oldDescription'] as string | undefined;
    const new_ = meta['newDescription'] as string | undefined;
    return (
      <div className="mt-2 flex flex-col gap-2">
        {old_ && (
          <div className="flex flex-col gap-1">
            <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
              Previous
            </span>
            <p className="text-xs text-[var(--ink-light)] leading-relaxed whitespace-pre-wrap
                          bg-[var(--ghost)] border border-[var(--border)] rounded-[8px] px-3 py-2 line-through decoration-[var(--ink-light)]/40">
              {old_}
            </p>
          </div>
        )}
        {old_ && new_ && (
          <div className="flex items-center justify-center">
            <ArrowRight size={12} className="text-[var(--ink-light)]" />
          </div>
        )}
        {new_ && (
          <div className="flex flex-col gap-1">
            <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
              Updated
            </span>
            <p className="text-xs text-[var(--ink)] leading-relaxed whitespace-pre-wrap
                          bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] px-3 py-2">
              {new_}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Split into prose (full-width) and pill items
  const proseEntries  = Object.entries(meta).filter(([k, v]) => PROSE_KEYS.has(k) && typeof v === 'string');
  const pillEntries   = Object.entries(meta).filter(([k, v]) => !PROSE_KEYS.has(k) && k !== 'fileUrl' && v != null);

  return (
    <div className="mt-2 flex flex-col gap-2">
      {/* Prose blocks */}
      {proseEntries.map(([k, v]) => (
        <MetaValue key={k} k={k} v={v} />
      ))}
      {/* Pill row */}
      {pillEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pillEntries.map(([k, v]) => (
            <MetaValue key={k} k={k} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single event row ──────────────────────────────────────────────────────────

function EventRow({ event, isLast }: { event: TicketEventResponse; isLast: boolean }) {
  const cfg = EVENT_CONFIG[event.eventType] ?? FALLBACK_CONFIG;

  return (
    <div className="flex gap-4">
      {/* Dot + connector line */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`w-7 h-7 rounded-full ${cfg.dotBg} border ${cfg.ring}
                         flex items-center justify-center shrink-0 ${cfg.color}`}>
          {cfg.icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-[var(--border)] mt-1.5 mb-0" />}
      </div>

      {/* Content */}
      <div className={`min-w-0 flex-1 ${isLast ? 'pb-2' : 'pb-5'}`}>
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-[var(--ink)]">{cfg.label}</span>
          <span className="text-[0.65rem] text-[var(--ink-light)]">by {event.performedByName}</span>
          <span className="text-[0.65rem] text-[var(--ink-light)] ml-auto shrink-0 tabular-nums">
            {formatLocalDateTime(event.timestamp)}
          </span>
        </div>

        {/* Metadata */}
        <EventMeta event={event} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function TicketTimeline({ ticketId }: { ticketId: string }) {
  const [open, setOpen] = useState(false);
  const { data: events, isLoading, isError } = useTicketEvents(ticketId, open);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5
                   hover:bg-[var(--ghost)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-[var(--ink-light)]" />
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
            Activity Timeline
          </span>
          {events && events.length > 0 && (
            <span className="text-[0.62rem] font-mono px-1.5 py-0.5 rounded-full
                             bg-[var(--ghost)] border border-[var(--border)] text-[var(--ink-light)]">
              {events.length}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp size={14} className="text-[var(--ink-light)]" />
          : <ChevronDown size={14} className="text-[var(--ink-light)]" />
        }
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pt-5 pb-3 border-t border-[var(--border)]">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
            </div>
          )}

          {isError && (
            <p className="text-xs text-[var(--ink-light)] text-center py-6">
              Failed to load activity.
            </p>
          )}

          {!isLoading && !isError && events?.length === 0 && (
            <p className="text-xs text-[var(--ink-light)] text-center py-6">
              No activity yet.
            </p>
          )}

          {!isLoading && !isError && events && events.length > 0 && (
            <div>
              {events.map((ev, i) => (
                <EventRow key={ev.id} event={ev} isLast={i === events.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
