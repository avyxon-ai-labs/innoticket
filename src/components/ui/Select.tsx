import {
  useState, useRef, useEffect, useId,
  type KeyboardEvent,
}                        from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { createPortal }  from 'react-dom';
import { cn }            from '../../utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value:     string;
  label:     string;
  disabled?: boolean;
}

interface SelectProps {
  options:      SelectOption[];
  value?:       string;
  onChange?:    (value: string) => void;
  placeholder?: string;
  label?:       string;
  error?:       string;
  hint?:        string;
  disabled?:    boolean;
  wrapClass?:   string;
  className?:   string;
  id?:          string;
  size?:        'sm' | 'md';
  searchable?:  boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Select({
  options,
  value = '',
  onChange,
  placeholder,
  label,
  error,
  hint,
  disabled,
  wrapClass,
  className,
  id,
  size = 'md',
  searchable = false,
}: SelectProps) {
  const uid        = useId();
  const selectId   = id ?? uid;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef    = useRef<HTMLUListElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(-1);
  const [query,   setQuery]   = useState('');
  const [pos,     setPos]     = useState({ top: 0, left: 0, width: 0, openUp: false });

  const selected = options.find((o) => o.value === value);

  // ── Position the floating panel relative to the trigger ──────────────────────
  function calcPos() {
    const btn = triggerRef.current;
    if (!btn) return;
    const r       = btn.getBoundingClientRect();
    const vp      = window.innerHeight;
    const spaceBelow = vp - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const openUp  = spaceBelow < 220 && spaceAbove > spaceBelow;
    setPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width, openUp });
  }

  // Open / close
  function handleToggle() {
    if (disabled) return;
    if (!open) {
      calcPos();
      setFocused(options.findIndex((o) => o.value === value && !o.disabled));
      setQuery('');
    } else {
      setQuery('');
    }
    setOpen((v) => !v);
  }

  // Auto-focus search input when panel opens
  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, searchable]);

  // Select option
  function handleSelect(opt: SelectOption) {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Keyboard nav on the trigger
  function handleTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { calcPos(); setOpen(true); setFocused(options.findIndex((o) => !o.disabled)); }
    }
    if (e.key === 'Escape') setOpen(false);
  }

  // Keyboard nav inside the list
  function handleListKey(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused((i) => {
        let next = i + 1;
        while (next < options.length && options[next].disabled) next++;
        return next < options.length ? next : i;
      });
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused((i) => {
        let prev = i - 1;
        while (prev >= 0 && options[prev].disabled) prev--;
        return prev >= 0 ? prev : i;
      });
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focused >= 0) handleSelect(options[focused]);
    }
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (open && focused >= 0 && listRef.current) {
      const el = listRef.current.children[focused] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focused, open]);

  // Recalculate position on scroll / resize
  useEffect(() => {
    if (!open) return;
    const update = () => calcPos();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [open]);

  // ── Filtered options (when searchable) ───────────────────────────────────────

  const q               = query.trim().toLowerCase();
  const visibleOptions  = searchable && q
    ? options.filter((o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
      )
    : options;

  // ── Render ────────────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = pos.openUp
    ? { bottom: window.innerHeight - pos.top + (triggerRef.current?.getBoundingClientRect().height ?? 0) + window.scrollY,
        left: pos.left, width: pos.width, position: 'fixed' }
    : { top: pos.top, left: pos.left, width: pos.width, position: 'fixed' };

  return (
    <div className={cn('flex flex-col gap-1', wrapClass)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase"
        >
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'rounded-[10px] border px-3 outline-none',
          size === 'sm' ? 'h-8 py-1.5 text-xs' : 'h-9 py-2 text-sm',
          'bg-[var(--ghost)] transition-colors duration-150',
          'focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-1',
          open
            ? 'border-[var(--sage)] bg-[var(--surface)]'
            : 'border-[var(--border)] hover:border-[var(--ink-light)]',
          error    && 'border-[var(--red)]',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <span className={cn('text-left break-words min-w-0', selected ? 'text-[var(--ink)]' : 'text-[var(--ink-light)]')}>
          {selected?.label ?? placeholder ?? 'Select…'}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-[var(--ink-light)] transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Floating dropdown panel */}
      {open && createPortal(
        <div
          style={panelStyle}
          className={cn(
            'z-[9999] mt-1 rounded-[12px] overflow-hidden',
            'bg-[var(--surface)] border border-[var(--border)]',
            'shadow-[var(--shadow-md)]',
            'animate-[modalIn_0.15s_cubic-bezier(0.34,1.4,0.64,1)]',
          )}
        >
          {/* Search bar */}
          {searchable && (
            <div className="px-2 pt-2 pb-1.5 border-b border-[var(--border)]">
              <div className="relative flex items-center">
                <Search size={12} className="absolute left-2.5 text-[var(--ink-light)] pointer-events-none shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setFocused(0); }}
                  placeholder="Search…"
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
                    tabIndex={-1}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleListKey}
            className="py-1 max-h-56 overflow-y-auto"
          >
            {visibleOptions.length === 0 ? (
              <li className="px-3 py-3 text-xs text-[var(--ink-light)] text-center">
                {q ? `No results for "${query}"` : 'No options'}
              </li>
            ) : (
              visibleOptions.map((opt, i) => {
                const isSelected = opt.value === value;
                const isFocused  = i === focused;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onMouseEnter={() => !opt.disabled && setFocused(i)}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      'flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer',
                      'transition-colors duration-100 select-none',
                      opt.disabled && 'opacity-40 cursor-not-allowed',
                      isSelected
                        ? 'bg-[var(--sage-light)] text-[var(--sage)] font-medium'
                        : isFocused
                          ? 'bg-[var(--ghost)] text-[var(--ink)]'
                          : 'text-[var(--ink)]',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={13} className="shrink-0 text-[var(--sage)]" />}
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer count when search is active */}
          {searchable && q && visibleOptions.length > 0 && visibleOptions.length < options.length && (
            <div className="px-3 py-1.5 border-t border-[var(--border)]">
              <p className="text-[0.65rem] text-[var(--ink-light)]">
                {visibleOptions.length} of {options.length} options
              </p>
            </div>
          )}
        </div>,
        document.body,
      )}

      {/* Error / hint */}
      {error && (
        <p className="text-xs text-[var(--red)]" role="alert">{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-[var(--ink-light)]">{hint}</p>
      )}
    </div>
  );
}

Select.displayName = 'Select';
