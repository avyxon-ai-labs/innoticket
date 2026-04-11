import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options:      SelectOption[];
  label?:       string;
  error?:       string;
  hint?:        string;
  placeholder?: string;
  wrapClass?:   string;
  onChange?:    (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, label, error, hint, placeholder, wrapClass, className, id, onChange, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

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

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              'w-full appearance-none rounded-[10px] border bg-[var(--ghost)]',
              'px-3 py-2 pr-8 text-sm text-[var(--ink)] outline-none',
              'transition-colors duration-150',
              'focus:border-[var(--sage)] focus:bg-[var(--surface)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-[var(--red)]'
                : 'border-[var(--border)]',
              className,
            )}
            aria-invalid={!!error}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-light)] pointer-events-none"
          />
        </div>

        {error && (
          <p className="text-xs text-[var(--red)]" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-[var(--ink-light)]">{hint}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
