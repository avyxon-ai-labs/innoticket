import { cn }              from '../../../utils';
import { useDashboardStore } from '../store';
import type { TicketTab }   from '../../../services/ticket.service';

const TABS: { key: TicketTab; label: string; dot: string; activeBg: string; activeText: string }[] = [
  { key: 'ESCALATED',   label: 'Escalated',   dot: '#F97316', activeBg: '#FFF7ED', activeText: '#C2410C'  },
  { key: 'OPEN',        label: 'Open',        dot: '#3B82F6', activeBg: '#EFF6FF', activeText: '#1D4ED8'  },
  { key: 'IN_PROGRESS', label: 'In Progress', dot: '#7C3AED', activeBg: '#F5F3FF', activeText: '#6D28D9'  },
  { key: 'RESOLVED',    label: 'Resolved',    dot: '#22C55E', activeBg: '#F0FDF4', activeText: '#15803D'  },
  { key: 'REJECTED',    label: 'Rejected',    dot: '#EF4444', activeBg: '#FEF2F2', activeText: '#DC2626'  },
  { key: 'WITHDRAWN',   label: 'Withdrawn',   dot: '#94A3B8', activeBg: '#F1F5F9', activeText: '#475569'  },
  { key: 'CLOSED',      label: 'Closed',      dot: '#64748B', activeBg: '#F8FAFC', activeText: '#374151'  },
];

export function DashboardTabs() {
  const { activeTab, setActiveTab } = useDashboardStore();
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex items-center gap-1 min-w-max">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px]',
                'text-xs font-semibold whitespace-nowrap transition-all',
                isActive
                  ? 'border'
                  : 'text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
              )}
              style={isActive
                ? { backgroundColor: tab.activeBg, color: tab.activeText, borderColor: tab.dot + '60' }
                : undefined}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? tab.dot : '#CBD5E1' }} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
