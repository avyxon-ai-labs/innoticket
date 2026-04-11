import { cn } from '../../utils';

export interface TabItem {
  id:     string;
  label:  string;
  count?: number;
}

type TabVariant = 'underline' | 'pills';

interface TabsProps {
  tabs:       TabItem[];
  activeTab:  string;
  onChange:   (id: string) => void;
  variant?:   TabVariant;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn('flex items-center gap-1', className)} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-medium',
                'transition-colors duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
                isActive
                  ? 'bg-[var(--sage-light)] text-[var(--sage)]'
                  : 'text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full leading-none',
                    isActive
                      ? 'bg-[var(--sage)] text-white'
                      : 'bg-[var(--border)] text-[var(--ink-light)]',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant (default)
  return (
    <div
      className={cn(
        'flex items-center gap-0 border-b border-[var(--border)]',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium',
              'border-b-2 -mb-px transition-colors duration-150 outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-inset',
              isActive
                ? 'border-[var(--sage)] text-[var(--sage)]'
                : 'border-transparent text-[var(--ink-light)] hover:text-[var(--ink)] hover:border-[var(--sage-mid)]',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full leading-none',
                  isActive
                    ? 'bg-[var(--sage-light)] text-[var(--sage)]'
                    : 'bg-[var(--border)] text-[var(--ink-light)]',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
