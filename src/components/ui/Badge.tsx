import { cn } from '../../utils';
import { badgeConfig, type BadgeVariant } from '../../lib/theme';

interface BadgeProps {
  variant: BadgeVariant | string;
  /** Override label (defaults to config label) */
  label?: string;
  /** Show dot indicator */
  dot?: boolean;
  className?: string;
}

export function Badge({ variant, label, dot = true, className }: BadgeProps) {
  const cfg = badgeConfig[variant as BadgeVariant] ?? {
    bg: '#F7F7F5',
    text: '#6B7280',
    label: variant,
  };

  const displayLabel = label ?? cfg.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'text-[0.7rem] font-semibold tracking-wide whitespace-nowrap',
        className,
      )}
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: cfg.text }}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}
