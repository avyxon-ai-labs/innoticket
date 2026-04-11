import { forwardRef } from 'react';
import { cn } from '../../utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:      string;
  error?:      string;
  hint?:       string;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  /** Additional wrapper class */
  wrapClass?:  string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, wrapClass, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1', wrapClass)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[var(--ink-light)] pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-[10px] border bg-[var(--ghost)] text-sm text-[var(--ink)]',
              'px-3 py-2 outline-none transition-colors duration-150',
              'placeholder:text-[var(--ink-light)]',
              'focus:border-[var(--sage)] focus:bg-[var(--surface)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-[var(--red)] focus:border-[var(--red)]'
                : 'border-[var(--border)]',
              leftIcon  && 'pl-9',
              rightIcon && 'pr-9',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...rest}
          />

          {rightIcon && (
            <span className="absolute right-3 text-[var(--ink-light)]">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--red)]" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--ink-light)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
