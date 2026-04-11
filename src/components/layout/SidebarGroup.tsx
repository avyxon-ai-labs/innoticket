import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { NavGroup } from '../../constants/navigation';
import { SidebarItem } from './SidebarItem';
import { useUIStore } from '../../store/uiStore';

interface Props {
  group: NavGroup;
  collapsed: boolean;
  onChildClick?: () => void;
}

export function SidebarGroup({ group, collapsed, onChildClick }: Props) {
  const { expandedGroups, toggleGroup } = useUIStore();
  const location = useLocation();

  const isExpanded = expandedGroups.includes(group.id);
  const Icon = group.icon;

  const hasActiveChild = group.children.some(
    (child) =>
      location.pathname === child.path ||
      location.pathname.startsWith(child.path + '/'),
  );

  // In collapsed mode: show just the group icon (with active dot if child active)
  if (collapsed) {
    return (
      <div className="relative flex justify-center">
        <button
          title={group.label}
          onClick={() => toggleGroup(group.id)}
          className={[
            'flex items-center justify-center px-2 py-2 rounded-lg w-full',
            'transition-colors duration-150 outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
            hasActiveChild
              ? 'bg-[var(--sage-light)] text-[var(--sage)]'
              : 'text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
          ].join(' ')}
          aria-label={group.label}
        >
          <Icon
            size={16}
            strokeWidth={hasActiveChild ? 2 : 1.75}
            className={hasActiveChild ? 'text-[var(--sage)]' : 'text-[var(--ink-light)]'}
          />
          {hasActiveChild && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--sage)]" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Group header button */}
      <button
        onClick={() => toggleGroup(group.id)}
        aria-expanded={isExpanded}
        className={[
          'group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
          'transition-colors duration-150 outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-1',
          hasActiveChild && !isExpanded
            ? 'bg-[var(--sage-light)] text-[var(--sage)]'
            : 'text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
        ].join(' ')}
      >
        <Icon
          size={16}
          strokeWidth={1.75}
          className={
            hasActiveChild && !isExpanded
              ? 'text-[var(--sage)]'
              : 'text-[var(--ink-light)] group-hover:text-[var(--ink)]'
          }
        />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronRight
          size={13}
          strokeWidth={2}
          className={[
            'shrink-0 transition-transform duration-200',
            isExpanded ? 'rotate-90' : 'rotate-0',
            hasActiveChild && !isExpanded ? 'text-[var(--sage)]' : 'text-[var(--ink-light)] opacity-60',
          ].join(' ')}
        />
      </button>

      {/* Children — max-height animation */}
      <div
        className={[
          'overflow-hidden transition-all duration-200 ease-in-out',
          isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="mt-0.5 flex flex-col gap-0.5 pb-1">
          {group.children.map((child) => (
            <SidebarItem
              key={child.id}
              item={child}
              collapsed={false}
              indented
              onClick={onChildClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
