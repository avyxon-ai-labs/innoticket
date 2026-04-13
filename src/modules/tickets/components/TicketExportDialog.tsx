import { useState }            from 'react';
import * as XLSX               from 'xlsx';
import { Download, X }         from 'lucide-react';
import { createPortal }        from 'react-dom';
import { cn }                  from '../../../utils';
import { Button }              from '../../../components/ui/Button';
import {
  formatLocalDateTime,
  formatDuration,
  formatActiveDuration,
}                              from '../../../utils';
import type { TicketResponse } from '../../../services/ticket.service';

// ── Column definitions ────────────────────────────────────────────────────────

interface ExportCol {
  key:      string;
  label:    string;
  getValue: (t: TicketResponse) => string | number;
}

const ALL_COLS: ExportCol[] = [
  { key: 'id',               label: 'Ticket No.',           getValue: (t) => `#${t.id}` },
  { key: 'createdAt',        label: 'Date & Time',          getValue: (t) => formatLocalDateTime(t.createdAt) },
  { key: 'status',           label: 'Status',               getValue: (t) => t.status },
  { key: 'projectCode',      label: 'Project Code',         getValue: (t) => t.project.projectCode },
  { key: 'projectName',      label: 'Project Name',         getValue: (t) => t.project.projectName },
  { key: 'centerCode',       label: 'Center Code',          getValue: (t) => t.center.centerCode },
  { key: 'centerName',       label: 'Center Name',          getValue: (t) => t.center.centerName },
  { key: 'state',            label: 'State',                getValue: (t) => t.center.state || '' },
  { key: 'city',             label: 'City',                 getValue: (t) => t.center.city || '' },
  { key: 'serviceName',      label: 'Service',              getValue: (t) => t.serviceName },
  { key: 'escalationType',   label: 'Escalation Type',      getValue: (t) => t.escalationType },
  { key: 'escalationLevel',  label: 'Escalation Level',     getValue: (t) => t.escalationLevel || 'NONE' },
  { key: 'activeDuration',   label: 'Active Duration',      getValue: (t) => formatActiveDuration(t.activeSince) || '' },
  { key: 'requestedByName',  label: 'Requested By',         getValue: (t) => t.creator?.fullName || '' },
  { key: 'requestedByUser',  label: 'Requested By (User)',  getValue: (t) => t.creator?.username || '' },
  { key: 'description',      label: 'Description',          getValue: (t) => t.description },
  { key: 'resolvedByName',   label: 'Resolved By',          getValue: (t) => t.resolvedBy?.fullName || '' },
  { key: 'resolvedByUser',   label: 'Resolved By (User)',   getValue: (t) => t.resolvedBy?.username || '' },
  { key: 'resolvedAt',       label: 'Resolved At',          getValue: (t) => t.resolvedAt ? formatLocalDateTime(t.resolvedAt) : '' },
  { key: 'resolvedRemarks',  label: 'Resolved Remarks',     getValue: (t) => t.resolvedRemarks || '' },
  { key: 'duration',         label: 'Duration',             getValue: (t) => t.totalDurationInMinutes != null ? formatDuration(t.totalDurationInMinutes) : '' },
  { key: 'slaL1',            label: 'SLA Level 1 (hrs)',    getValue: (t) => t.project.slaLevel1Hours },
  { key: 'slaL2',            label: 'SLA Level 2 (hrs)',    getValue: (t) => t.project.slaLevel2Hours },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  onClose: () => void;
  rows:    TicketResponse[];
  /** Used to name the file, e.g. "tickets_OPEN" */
  context?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketExportDialog({ open, onClose, rows, context = 'tickets' }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ALL_COLS.map((c) => c.key)),
  );

  if (!open) return null;

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function selectAll()  { setSelected(new Set(ALL_COLS.map((c) => c.key))); }
  function clearAll()   { setSelected(new Set()); }

  const activeCols = ALL_COLS.filter((c) => selected.has(c.key));

  function handleExport() {
    if (activeCols.length === 0 || rows.length === 0) return;

    // Build data rows
    const data = rows.map((t) => {
      const row: Record<string, string | number> = {};
      for (const col of activeCols) {
        row[col.label] = col.getValue(t);
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-width columns
    const colWidths = activeCols.map((col) => {
      const headerLen = col.label.length;
      const maxDataLen = rows.reduce((max, t) => {
        const val = String(col.getValue(t));
        return Math.max(max, val.length);
      }, 0);
      return { wch: Math.min(Math.max(headerLen, maxDataLen) + 2, 60) };
    });
    ws['!cols'] = colWidths;

    // Style header row (bold) — SheetJS CE doesn't support cell styles,
    // but we still freeze the top row for readability
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');

    const ts   = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    const name = `${context}_${ts}.xlsx`;
    XLSX.writeFile(wb, name);

    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export Tickets"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(15,17,23,0.42)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={cn(
        'relative w-full max-w-md bg-[var(--surface)] z-10 outline-none',
        'rounded-t-[20px] sm:rounded-[20px]',
        'shadow-[var(--shadow-lg)]',
        'animate-[slideUp_0.28s_cubic-bezier(0.34,1.4,0.64,1)] sm:animate-[modalIn_0.22s_cubic-bezier(0.34,1.4,0.64,1)]',
        'flex flex-col max-h-[85vh]',
      )}>
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]"
                style={{ fontFamily: 'var(--font-display)' }}>
              Export Tickets
            </h2>
            <p className="text-xs text-[var(--ink-light)] mt-0.5">
              {rows.length} row{rows.length !== 1 ? 's' : ''} · select columns to include
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 p-1.5 rounded-[8px] text-[var(--ink-light)]
                       hover:bg-[var(--ghost)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Column selection */}
        <div className="px-5 py-3 flex-1 overflow-y-auto">
          {/* Quick actions */}
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-medium text-[var(--sage)] hover:opacity-80 transition-opacity"
            >
              Select all
            </button>
            <span className="text-[var(--border)]">·</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors"
            >
              Clear all
            </button>
            <span className="ml-auto text-xs text-[var(--ink-light)]">
              {selected.size} / {ALL_COLS.length} selected
            </span>
          </div>

          {/* Checkbox grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_COLS.map((col) => {
              const checked = selected.has(col.key);
              return (
                <label
                  key={col.key}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-[8px] cursor-pointer',
                    'border transition-colors text-xs select-none',
                    checked
                      ? 'border-[var(--sage)] bg-[var(--sage-light)] text-[var(--sage)] font-medium'
                      : 'border-[var(--border)] bg-[var(--ghost)] text-[var(--ink-mid)] hover:border-[var(--ink-light)]',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(col.key)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'w-3.5 h-3.5 rounded-[3px] border shrink-0 flex items-center justify-center',
                      checked
                        ? 'bg-[var(--sage)] border-[var(--sage)]'
                        : 'border-[var(--border)] bg-[var(--surface)]',
                    )}
                  >
                    {checked && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {col.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] shrink-0
                        flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--ink-light)]">
            Exports as <span className="font-semibold text-[var(--ink)]">.xlsx</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={handleExport}
              disabled={selected.size === 0 || rows.length === 0}
            >
              Export {rows.length} rows
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
