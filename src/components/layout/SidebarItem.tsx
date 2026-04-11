import { NavLink } from 'react-router-dom';
import type { NavLeaf } from '../../constants/navigation';

interface Props {
  item: NavLeaf;
  collapsed: boolean;
  indented?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ item, collapsed, indented = false, onClick }: Props) {
  const { icon: Icon, label, path } = item;

  return (
    <NavLink
      to={path}
      end={path === '/'}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'group relative flex items-center gap-3 rounded-lg text-sm font-medium',
          'transition-colors duration-150 outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-1',
          collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2',
          indented && !collapsed ? 'ml-4 pl-3' : '',
          isActive
            ? 'bg-[var(--sage-light)] text-[var(--sage)] font-semibold'
            : 'text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {/* Active left-border indicator (expanded only) */}
          {!collapsed && isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[var(--sage)]"
              aria-hidden="true"
            />
          )}

          <Icon
            size={16}
            strokeWidth={isActive ? 2 : 1.75}
            className={isActive ? 'text-[var(--sage)]' : 'text-[var(--ink-light)] group-hover:text-[var(--ink)]'}
          />

          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
