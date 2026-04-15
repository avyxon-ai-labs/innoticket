import { cn } from '../../../../utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MappingRow {
  id:            string; // local React key only
  service:       string;
  deliveryAgent: string; // username of DELIVERY-group agent (optional)
  opsAgent:      string; // username of OPS-group agent (optional)
}

interface Props {
  rows:     MappingRow[];
  onChange: (rows: MappingRow[]) => void;
  disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders all project services as a fixed grid.
 * Delivery / OPS agent inputs are optional — rows are always saved.
 * The parent drives `rows` by syncing from available project services.
 */
export function ServiceMappingEditor({ rows, onChange, disabled }: Props) {

  function patchRow(id: string, field: 'deliveryAgent' | 'opsAgent', value: string) {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  const filledCount = rows.filter((r) => r.deliveryAgent || r.opsAgent).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
          Service Mappings
        </span>
        <div className="rounded-[10px] border border-dashed border-[var(--border)] px-4 py-5 text-center">
          <p className="text-xs text-[var(--ink-light)]">
            Select a project to load its services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
          Service Mappings
        </span>
        <span className="text-[0.65rem] text-[var(--ink-light)]">
          {filledCount} / {rows.length} assigned
        </span>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 px-1">
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)]">
          Service
        </span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#15803D]">
          Delivery Agent
        </span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#1D4ED8]">
          OPS Agent
        </span>
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y divide-[var(--border)] rounded-[12px]
                      border border-[var(--border)] overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 items-center
                       px-3 py-2 bg-[var(--surface)] first:pt-3 last:pb-3"
          >
            {/* Service name — read-only badge */}
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-[6px] text-xs font-semibold',
              'bg-[var(--sage-light)] text-[var(--sage)] font-mono tracking-wide truncate w-fit max-w-full',
            )}>
              {row.service}
            </span>

            {/* Delivery agent username */}
            <input
              type="text"
              placeholder="delivery username"
              value={row.deliveryAgent}
              onChange={(e) => patchRow(row.id, 'deliveryAgent', e.target.value.toLowerCase())}
              disabled={disabled}
              className={cn(
                'w-full rounded-[8px] border border-[var(--border)] bg-[var(--ghost)]',
                'text-sm text-[#15803D] px-2.5 py-1.5 outline-none transition-colors font-mono',
                'placeholder:text-[var(--ink-light)] placeholder:font-sans placeholder:text-xs',
                'focus:border-[#15803D]/60 focus:bg-[var(--surface)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            />

            {/* OPS agent username */}
            <input
              type="text"
              placeholder="ops username"
              value={row.opsAgent}
              onChange={(e) => patchRow(row.id, 'opsAgent', e.target.value.toLowerCase())}
              disabled={disabled}
              className={cn(
                'w-full rounded-[8px] border border-[var(--border)] bg-[var(--ghost)]',
                'text-sm text-[#1D4ED8] px-2.5 py-1.5 outline-none transition-colors font-mono',
                'placeholder:text-[var(--ink-light)] placeholder:font-sans placeholder:text-xs',
                'focus:border-[#1D4ED8]/60 focus:bg-[var(--surface)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            />
          </div>
        ))}
      </div>

      <p className="text-[0.65rem] text-[var(--ink-light)] pl-0.5">
        Agent usernames are optional — rows without assignments are still saved.
      </p>
    </div>
  );
}
