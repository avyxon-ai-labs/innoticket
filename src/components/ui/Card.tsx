import { cn } from '../../utils';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children:    React.ReactNode;
  className?:  string;
  padding?:    Padding;
  hoverable?:  boolean;
  /** Rendered inside the card above children */
  header?:     React.ReactNode;
  /** Rendered inside the card below children */
  footer?:     React.ReactNode;
  onClick?:    () => void;
}

const paddingMap: Record<Padding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

export function Card({
  children,
  className,
  padding = 'md',
  hoverable = false,
  header,
  footer,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[14px]',
        'transition-shadow duration-200',
        hoverable &&
          'cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--sage-mid)]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {header && (
        <div className="px-4 py-3 border-b border-[var(--border)]">
          {header}
        </div>
      )}
      <div className={cn(paddingMap[padding])}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-[var(--border)]">
          {footer}
        </div>
      )}
    </div>
  );
}
