import { useRef, useEffect }  from 'react';
import { Check, Minus }       from 'lucide-react';
import { cn }                 from '../../utils';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  checked:        boolean;
  onChange:       () => void;
  /** Shows a dash — used for "some selected on page" header state */
  indeterminate?: boolean;
  disabled?:      boolean;
  'aria-label'?:  string;
  className?:     string;
}

// ── Component ─────────────────────────────────────────────────────────────────
// Fully custom-styled checkbox — visible in both light and dark modes.
// Replaces native <input type="checkbox"> whose unchecked border is
// near-invisible on light surfaces with many browsers/OSes.

export function Checkbox({
  checked, onChange, indeterminate = false,
  disabled, className, ...aria
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep native indeterminate property in sync (CSS :indeterminate selector)
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const active = checked || indeterminate;

  return (
    <label
      className={cn(
        'relative inline-flex items-center justify-center cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {/* Hidden native input — keeps keyboard & screen-reader accessibility */}
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only peer"
        {...aria}
      />

      {/* Visual box */}
      <span
        aria-hidden="true"
        className={cn(
          'w-[15px] h-[15px] rounded-[4px] border-[1.5px] shrink-0',
          'flex items-center justify-center',
          'transition-colors duration-150',
          // Focus ring via peer
          'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--sage)] peer-focus-visible:ring-offset-1',
          active
            ? 'bg-[var(--sage)] border-[var(--sage)]'
            : 'bg-[var(--surface)] border-[#94A3B8] hover:border-[var(--sage)]',
        )}
      >
        {checked && !indeterminate && (
          <Check size={9} className="text-white" strokeWidth={3} />
        )}
        {indeterminate && (
          <Minus size={9} className="text-white" strokeWidth={3} />
        )}
      </span>
    </label>
  );
}
