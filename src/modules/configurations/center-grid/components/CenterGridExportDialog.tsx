import { useState, useMemo }       from 'react';
import * as XLSX                    from 'xlsx';
import { Download, X }              from 'lucide-react';
import { createPortal }             from 'react-dom';
import { cn }                       from '../../../../utils';
import { Button }                   from '../../../../components/ui/Button';
import { useActiveServiceNames }    from '../hooks';
import type { CenterGridResponse }  from '../../../../services/center-grid.service';

// ── Fixed column definitions ───────────────────────────────────────────────────

interface FixedCol {
  key:      string;
  label:    string;
  getValue: (r: CenterGridResponse) => string | number;
}

const FIXED_COLS: FixedCol[] = [
  { key: 'projectCode',   label: 'Project Code',    getValue: (r) => r.projectCode   },
  { key: 'centerCode',    label: 'Center Code',     getValue: (r) => r.centerCode    },
  { key: 'centerName',    label: 'Center Name',     getValue: (r) => r.centerName    },
  { key: 'state',         label: 'State',           getValue: (r) => r.state         },
  { key: 'city',          label: 'City',            getValue: (r) => r.city          },
  { key: 'centerAddress', label: 'Center Address',  getValue: (r) => r.centerAddress },
  { key: 'csupName',      label: 'CSUP Name',       getValue: (r) => r.csupName      },
  { key: 'csupNumber',    label: 'CSUP Number',     getValue: (r) => r.csupNumber    },
  { key: 'totalCandidate',label: 'Total Candidate', getValue: (r) => r.totalCandidate},
  { key: 'examDates',     label: 'Exam Dates',      getValue: (r) => r.examDates     },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  onClose: () => void;
  rows:    CenterGridResponse[];
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CenterGridExportDialog({ open, onClose, rows }: Props) {
  // All active service names from server + any present in current rows
  const { data: activeServices = [] } = useActiveServiceNames();

  // Collect every service name present in the loaded rows
  const rowServices = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => Object.keys(r.serviceMappings).forEach((k) => s.add(k)));
    return [...s].sort();
  }, [rows]);

  // Union: active services first (deterministic order), then any extras from rows
  const allServices = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of [...activeServices, ...rowServices]) {
      if (!seen.has(s)) { seen.add(s); result.push(s); }
    }
    return result.sort();
  }, [activeServices, rowServices]);

  // Selection state — everything on by default
  const allKeys = useMemo(
    () => [...FIXED_COLS.map((c) => c.key), ...allServices.map((s) => `svc::${s}`)],
    [allServices],
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set(allKeys));

  // Re-initialise when services load (first render may have empty allKeys)
  // We use a key on the outer portal instead — simpler.

  if (!open) return null;

  function toggle(key: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  function selectAll() { setSelected(new Set(allKeys)); }
  function clearAll()  { setSelected(new Set()); }

  // ── Export ────────────────────────────────────────────────────────────────

  function handleExport() {
    const activeFixed = FIXED_COLS.filter((c) => selected.has(c.key));
    const activeSvcs  = allServices.filter((s) => selected.has(`svc::${s}`));

    if (activeFixed.length + activeSvcs.length === 0) return;

    const data = rows.map((r) => {
      const row: Record<string, string | number> = {};

      for (const col of activeFixed) {
        row[col.label] = col.getValue(r) ?? '';
      }
      for (const svc of activeSvcs) {
        row[`${svc} (Agent Email)`] = r.serviceMappings[svc] ?? '';
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-width
    const headers = [
      ...activeFixed.map((c) => c.label),
      ...activeSvcs.map((s) => `${s} (Agent Email)`),
    ];
    ws['!cols'] = headers.map((h) => {
      const maxData = rows.reduce((mx, r) => {
        const key = FIXED_COLS.find((c) => c.label === h)?.key;
        const val = key
          ? String(FIXED_COLS.find((c) => c.label === h)?.getValue(r) ?? '')
          : String(r.serviceMappings[h.replace(' (Agent Email)', '')] ?? '');
        return Math.max(mx, val.length);
      }, 0);
      return { wch: Math.min(Math.max(h.length, maxData) + 2, 60) };
    });

    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CentreGrid');

    const ts   = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    XLSX.writeFile(wb, `centre_grid_${ts}.xlsx`);
    onClose();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const totalCols   = FIXED_COLS.length + allServices.length;
  const selectedCnt = [...selected].filter((k) => allKeys.includes(k)).length;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export Centre Grid"
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
        'relative w-full max-w-lg bg-[var(--surface)] z-10 outline-none',
        'rounded-t-[20px] sm:rounded-[20px] shadow-[var(--shadow-lg)]',
        'animate-[slideUp_0.28s_cubic-bezier(0.34,1.4,0.64,1)] sm:animate-[modalIn_0.22s_cubic-bezier(0.34,1.4,0.64,1)]',
        'flex flex-col max-h-[85vh]',
      )}>
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]"
                style={{ fontFamily: 'var(--font-display)' }}>
              Export Centre Grid
            </h2>
            <p className="text-xs text-[var(--ink-light)] mt-0.5">
              {rows.length} row{rows.length !== 1 ? 's' : ''} · select columns to include
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="ml-4 shrink-0 p-1.5 rounded-[8px] text-[var(--ink-light)]
                       hover:bg-[var(--ghost)] hover:text-[var(--ink)] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Column picker */}
        <div className="px-5 py-3 flex-1 overflow-y-auto">
          {/* Quick actions */}
          <div className="flex items-center gap-3 mb-3">
            <button type="button" onClick={selectAll}
              className="text-xs font-medium text-[var(--sage)] hover:opacity-80 transition-opacity">
              Select all
            </button>
            <span className="text-[var(--border)]">·</span>
            <button type="button" onClick={clearAll}
              className="text-xs font-medium text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors">
              Clear all
            </button>
            <span className="ml-auto text-xs text-[var(--ink-light)]">
              {selectedCnt} / {totalCols} selected
            </span>
          </div>

          {/* Fixed columns */}
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider
                        text-[var(--ink-light)] mb-2">
            Fixed columns
          </p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {FIXED_COLS.map((col) => {
              const checked = selected.has(col.key);
              return (
                <ColPill key={col.key} label={col.label} checked={checked}
                         onToggle={() => toggle(col.key)} />
              );
            })}
          </div>

          {/* Service columns */}
          {allServices.length > 0 && (
            <>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider
                            text-[var(--ink-light)] mb-2">
                Service columns <span className="normal-case font-normal">(agent email per service)</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {allServices.map((svc) => {
                  const key     = `svc::${svc}`;
                  const checked = selected.has(key);
                  return (
                    <ColPill key={key} label={`${svc} (Agent Email)`} checked={checked}
                             onToggle={() => toggle(key)} />
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] shrink-0
                        flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--ink-light)]">
            Exports as <span className="font-semibold text-[var(--ink)]">.xlsx</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={handleExport}
              disabled={selectedCnt === 0 || rows.length === 0}
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

// ── Reusable checkbox pill ─────────────────────────────────────────────────────

function ColPill({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-[8px] cursor-pointer',
      'border transition-colors text-xs select-none',
      checked
        ? 'border-[var(--sage)] bg-[var(--sage-light)] text-[var(--sage)] font-medium'
        : 'border-[var(--border)] bg-[var(--ghost)] text-[var(--ink-mid)] hover:border-[var(--ink-light)]',
    )}>
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span className={cn(
        'w-3.5 h-3.5 rounded-[3px] border shrink-0 flex items-center justify-center',
        checked ? 'bg-[var(--sage)] border-[var(--sage)]' : 'border-[var(--border)] bg-[var(--surface)]',
      )}>
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="truncate">{label}</span>
    </label>
  );
}
