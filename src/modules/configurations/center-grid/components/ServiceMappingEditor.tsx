import { Plus, Trash2 }  from 'lucide-react';
import { cn }            from '../../../../utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MappingRow {
  id:      string; // local key for React
  service: string;
  email:   string;
}

interface Props {
  rows:              MappingRow[];
  onChange:          (rows: MappingRow[]) => void;
  availableServices: string[];
  errors?:           Record<string, string>; // keyed by row.id
  disabled?:         boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceMappingEditor({
  rows,
  onChange,
  availableServices,
  errors = {},
  disabled,
}: Props) {
  const selectedServices = new Set(rows.map((r) => r.service));

  function addRow() {
    onChange([
      ...rows,
      { id: crypto.randomUUID(), service: '', email: '' },
    ]);
  }

  function removeRow(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  function patchRow(id: string, field: 'service' | 'email', value: string) {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
          Service Mappings
        </span>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--sage)]
                     hover:text-[var(--sage-dark)] disabled:opacity-40 transition-colors"
        >
          <Plus size={13} />
          Add Service
        </button>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="rounded-[10px] border border-dashed border-[var(--border)] px-4 py-5 text-center">
          <p className="text-xs text-[var(--ink-light)]">
            No services mapped. Click "Add Service" to begin.
          </p>
        </div>
      )}

      {/* Rows */}
      {rows.map((row) => {
        // Available options: all services minus already-selected ones, but keep current row's value
        const options = availableServices.filter(
          (s) => !selectedServices.has(s) || s === row.service,
        );
        const rowError = errors[row.id];

        return (
          <div key={row.id} className="flex flex-col gap-1">
            <div className="flex gap-2 items-start">
              {/* Service name select */}
              <div className="flex-1 relative">
                <select
                  value={row.service}
                  onChange={(e) => patchRow(row.id, 'service', e.target.value)}
                  disabled={disabled}
                  className={cn(
                    'w-full appearance-none rounded-[10px] border bg-[var(--ghost)]',
                    'px-3 py-2 text-sm text-[var(--ink)] outline-none',
                    'focus:border-[var(--sage)] focus:bg-[var(--surface)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                    rowError ? 'border-[var(--red)]' : 'border-[var(--border)]',
                  )}
                >
                  <option value="" disabled>Select service…</option>
                  {options.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Agent email */}
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Agent email"
                  value={row.email}
                  onChange={(e) => patchRow(row.id, 'email', e.target.value)}
                  disabled={disabled}
                  className={cn(
                    'w-full rounded-[10px] border bg-[var(--ghost)] text-sm text-[var(--ink)]',
                    'px-3 py-2 outline-none transition-colors duration-150',
                    'placeholder:text-[var(--ink-light)]',
                    'focus:border-[var(--sage)] focus:bg-[var(--surface)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    rowError ? 'border-[var(--red)]' : 'border-[var(--border)]',
                  )}
                />
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={disabled}
                className="mt-1 p-2 rounded-[8px] text-[var(--ink-light)] hover:bg-[var(--red-light)]
                           hover:text-[var(--red)] transition-colors disabled:opacity-40"
                aria-label="Remove mapping"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {rowError && (
              <p className="text-xs text-[var(--red)] pl-1" role="alert">{rowError}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
