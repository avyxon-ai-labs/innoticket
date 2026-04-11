import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X }       from 'lucide-react';
import { cn }                          from '../../utils';
import { Spinner }                     from './Spinner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MultiSelectProps {
  options:      string[];
  value:        string[];
  onChange:     (values: string[]) => void;
  placeholder?: string;
  label?:       string;
  disabled?:    boolean;
  loading?:     boolean;
  wrapClass?:   string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'All',
  label,
  disabled,
  loading,
  wrapClass,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef    = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  function toggle(opt: string) {
    onChange(
      value.includes(opt)
        ? value.filter((v) => v !== opt)
        : [...value, opt],
    );
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }

  const count = value.length;
  const isDisabled = disabled || loading;

  // ── Trigger label ─────────────────────────────────────────────────────────

  function TriggerContent() {
    if (loading) {
      return (
        <span className="flex items-center gap-1.5 text-[var(--ink-light)]">
          <Spinner size="sm" /> Loading…
        </span>
      );
    }
    if (count === 0) {
      return <span className="text-[var(--ink-light)] truncate">{placeholder}</span>;
    }
    if (count === 1) {
      return (
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="px-1.5 py-0.5 rounded-md bg-[var(--sage-light)] text-[var(--sage)]
                           text-xs font-semibold truncate max-w-[10rem]">
            {value[0]}
          </span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded-md bg-[var(--sage-light)] text-[var(--sage)]
                         text-xs font-semibold">
          {count} selected
        </span>
      </span>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col gap-1', wrapClass)} ref={containerRef}>
      {label && (
        <span className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
          {label}
        </span>
      )}

      {/* Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !isDisabled && setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={isDisabled}
          className={cn(
            'w-full flex items-center justify-between gap-2',
            'rounded-[10px] border bg-[var(--ghost)] px-3 py-2 text-sm text-left',
            'transition-colors duration-150 outline-none min-h-[38px]',
            'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            open
              ? 'border-[var(--sage)] bg-[var(--surface)]'
              : 'border-[var(--border)] hover:border-[var(--ink-light)]',
          )}
        >
          <span className="flex-1 min-w-0 overflow-hidden">
            <TriggerContent />
          </span>

          <span className="flex items-center gap-1 shrink-0">
            {count > 0 && !isDisabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={clearAll}
                onKeyDown={(e) => e.key === 'Enter' && clearAll(e as unknown as React.MouseEvent)}
                className="p-0.5 rounded hover:bg-[var(--border)] text-[var(--ink-light)]
                           hover:text-[var(--ink)] transition-colors"
                aria-label="Clear selection"
              >
                <X size={11} />
              </span>
            )}
            <ChevronDown
              size={13}
              className={cn(
                'text-[var(--ink-light)] transition-transform duration-150',
                open && 'rotate-180',
              )}
            />
          </span>
        </button>

        {/* Dropdown */}
        {open && options.length > 0 && (
          <div
            role="listbox"
            aria-multiselectable="true"
            className={cn(
              'absolute z-30 top-[calc(100%+4px)] left-0 right-0',
              'bg-[var(--surface)] border border-[var(--border)] rounded-[12px]',
              'shadow-[var(--shadow-md)] py-1 max-h-52 overflow-y-auto',
            )}
          >
            {options.map((opt) => {
              const selected = value.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggle(opt)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left',
                    'transition-colors duration-100 outline-none',
                    'focus-visible:bg-[var(--ghost)]',
                    selected
                      ? 'bg-[var(--sage-light)] text-[var(--sage)]'
                      : 'text-[var(--ink)] hover:bg-[var(--ghost)]',
                  )}
                >
                  <span
                    className={cn(
                      'w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0',
                      selected
                        ? 'bg-[var(--sage)] border-[var(--sage)]'
                        : 'border-[var(--border)] bg-[var(--surface)]',
                    )}
                  >
                    {selected && <Check size={9} strokeWidth={3} className="text-white" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* No options */}
        {open && options.length === 0 && !loading && (
          <div className="absolute z-30 top-[calc(100%+4px)] left-0 right-0 bg-[var(--surface)]
                          border border-[var(--border)] rounded-[12px] shadow-[var(--shadow-md)]
                          px-3 py-3 text-center">
            <p className="text-xs text-[var(--ink-light)]">No options available</p>
          </div>
        )}
      </div>
    </div>
  );
}
