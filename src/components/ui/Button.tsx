import { forwardRef } from 'react';
import { cn } from '../../utils';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant;
  size?:      Size;
  loading?:   boolean;
  fullWidth?: boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-[10px] ' +
  'transition-colors duration-150 outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-1 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--ink)] text-white hover:bg-[var(--ink-mid)] active:bg-[var(--ink)]',
  secondary:
    'bg-[var(--sage-light)] text-[var(--sage)] hover:bg-[var(--sage-mid)] active:bg-[var(--sage-light)]',
  danger:
    'bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white active:bg-[var(--red)]',
  ghost:
    'bg-transparent text-[var(--ink-mid)] hover:bg-[var(--ghost)] hover:text-[var(--ink)] active:bg-[var(--border)]',
  outline:
    'bg-transparent border border-[var(--border)] text-[var(--ink-mid)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs h-8',
  md: 'px-4 py-2 text-sm h-9',
  lg: 'px-5 py-2.5 text-sm h-10',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
