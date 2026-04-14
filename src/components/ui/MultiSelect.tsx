import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn }                            from '../../utils';
import { Spinner }                       from './Spinner';

// ── Types ─────────────────────────────────────────────────────────────────────

/** An option can be a plain string or a { value, label } object. */
export type MsOption = string | { value: string; label: string };

function optVal(o: MsOption)   { return typeof o === 'string' ? o : o.value; }
function optLabel(o: MsOption) { return typeof o === 'string' ? o : o.label; }

interface MultiSelectProps {
  options:      MsOption[];
  value:        string[];
  onChange:     (values: string[]) => void;
  placeholder?: string;
  label?:       string;
  disabled?:    boolean;
  loading?:     boolean;
  wrapClass?:   string;
  /** Enables in-dropdown search with selected-first ordering */
  searchable?:  boolean;
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
  searchable = false,
}: MultiSelectProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const containerRef      = useRef<HTMLDivElement>(null);
  const searchRef         = useRef<HTMLInputElement>(null);

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

  // Close on ESC, prevent ESC from bubbling (e.g. closing a modal behind it)
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [open]);

  // Auto-focus search when opening; reset query when closing
  useEffect(() => {
    if (open && searchable) {
      // rAF so the DOM node exists before we focus
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open) setQuery('');
  }, [open, searchable]);

  function toggle(opt: MsOption) {
    const v = optVal(opt);
    onChange(
      value.includes(v)
        ? value.filter((x) => x !== v)
        : [...value, v],
    );
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }

  const count      = value.length;
  const isDisabled = disabled || loading;

  // ── Filtered + sorted display list ────────────────────────────────────────
  // Selected items always float to the top; then rest filtered by query.
  const q = query.trim().toLowerCase();

  const displayOptions = searchable
    ? [
        ...options.filter((o) =>  value.includes(optVal(o)) && (!q || optVal(o).toLowerCase().includes(q) || optLabel(o).toLowerCase().includes(q))),
        ...options.filter((o) => !value.includes(optVal(o)) && (!q || optVal(o).toLowerCase().includes(q) || optLabel(o).toLowerCase().includes(q))),
      ]
    : options;

  // Where the boundary between selected and unselected sits in displayOptions
  const selectedInView  = displayOptions.filter((o) => value.includes(optVal(o))).length;
  const showDivider     = searchable && selectedInView > 0 && selectedInView < displayOptions.length;

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
      const matchedOpt = options.find((o) => optVal(o) === value[0]);
      const display    = matchedOpt ? optLabel(matchedOpt) : value[0];
      return (
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="px-1.5 py-0.5 rounded-md bg-[var(--sage-light)] text-[var(--sage)]
                           text-xs font-semibold truncate max-w-[10rem]">
            {display}
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
                'text-[var(--ink-light)] transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </span>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            role="listbox"
            aria-multiselectable="true"
            className={cn(
              'absolute z-30 top-[calc(100%+4px)] left-0 right-0',
              'bg-[var(--surface)] border border-[var(--border)] rounded-[12px]',
              'shadow-[var(--shadow-md)] overflow-hidden',
              'animate-[fadeUp_0.15s_ease]',
            )}
          >
            {/* Search bar — only when searchable */}
            {searchable && (
              <div className="px-2 pt-2 pb-1.5 border-b border-[var(--border)]">
                <div className="relative flex items-center">
                  <Search
                    size={12}
                    className="absolute left-2.5 text-[var(--ink-light)] pointer-events-none shrink-0"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search centres…"
                    // Prevent trigger toggle when clicking inside search
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'w-full pl-7 py-1.5 text-xs rounded-[8px]',
                      'bg-[var(--ghost)] border border-[var(--border)]',
                      'text-[var(--ink)] placeholder:text-[var(--ink-light)]',
                      'outline-none transition-colors duration-150',
                      'focus:border-[var(--sage)] focus:bg-[var(--surface)]',
                      query ? 'pr-7' : 'pr-2.5',
                    )}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                      className="absolute right-2 text-[var(--ink-light)] hover:text-[var(--ink)]
                                 transition-colors rounded p-0.5"
                      aria-label="Clear search"
                      tabIndex={-1}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="py-1 max-h-48 overflow-y-auto overscroll-contain">
              {displayOptions.length > 0 ? (
                displayOptions.map((opt, idx) => {
                  const v        = optVal(opt);
                  const l        = optLabel(opt);
                  const selected = value.includes(v);
                  return (
                    <div key={v}>
                      {/* Divider between selected and unselected groups */}
                      {showDivider && idx === selectedInView && (
                        <div className="my-1 mx-2 border-t border-[var(--border)]" />
                      )}
                      <button
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
                            'transition-colors duration-100',
                            selected
                              ? 'bg-[var(--sage)] border-[var(--sage)]'
                              : 'border-[var(--border)] bg-[var(--surface)]',
                          )}
                        >
                          {selected && <Check size={9} strokeWidth={3} className="text-white" />}
                        </span>
                        <span className="truncate">{l}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center">
                  {q ? (
                    <p className="text-xs text-[var(--ink-light)]">
                      No centres match{' '}
                      <span className="font-medium text-[var(--ink)]">"{query}"</span>
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--ink-light)]">No options available</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint when results are filtered */}
            {searchable && q && displayOptions.length > 0 && displayOptions.length < options.length && (
              <div className="px-3 py-1.5 border-t border-[var(--border)]">
                <p className="text-[0.65rem] text-[var(--ink-light)]">
                  {displayOptions.length} of {options.length} centres
                </p>
              </div>
            )}
          </div>
        )}

        {/* No options (non-searchable path) */}
        {open && !searchable && options.length === 0 && !loading && (
          <div className="absolute z-30 top-[calc(100%+4px)] left-0 right-0 bg-[var(--surface)]
                          border border-[var(--border)] rounded-[12px] shadow-[var(--shadow-md)]
                          px-3 py-3 text-center animate-[fadeUp_0.15s_ease]">
            <p className="text-xs text-[var(--ink-light)]">No options available</p>
          </div>
        )}
      </div>
    </div>
  );
}
