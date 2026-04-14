import { PanelLeftClose } from 'lucide-react';
import { NAV_ENTRIES, NAV_JOBS } from '../../constants/navigation';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { SidebarItem } from './SidebarItem';
import { SidebarGroup } from './SidebarGroup';
import { UserProfile } from './UserProfile';

interface Props {
  collapsed: boolean;
  /** called after a nav click (used by mobile drawer to close) */
  onNavClick?: () => void;
  /** hide the collapse toggle (e.g. inside mobile drawer) */
  hideToggle?: boolean;
}

export function SidebarContent({ collapsed, onNavClick, hideToggle = false }: Props) {
  const { toggleCollapse } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const role    = user?.role?.toUpperCase();
  const isAdmin  = role === 'ADMIN';
  const isClient = role === 'CLIENT';
  const visibleEntries = NAV_ENTRIES.filter((entry) => {
    if (entry.adminOnly && !isAdmin) return false;   // group or item: ADMIN only
    if (entry.type === 'item' && entry.clientHidden && isClient) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Brand ──────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-[var(--border)] min-h-[56px] px-3 py-3">
        {collapsed ? (
          /* Collapsed: logo IS the expand button — nothing else fits */
          <button
            onClick={!hideToggle ? toggleCollapse : undefined}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className={[
              'w-8 h-8 rounded-[9px] bg-[var(--ink)] flex items-center justify-center mx-auto',
              !hideToggle ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default',
              'outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
            ].join(' ')}
          >
            <span
              className="text-white text-xs font-bold"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              IT
            </span>
          </button>
        ) : (
          /* Expanded: logo + name + collapse button */
          <>
            <div className="w-8 h-8 rounded-[9px] bg-[var(--ink)] flex items-center justify-center shrink-0">
              <span
                className="text-white text-xs font-bold"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                IT
              </span>
            </div>
            <span
              className="flex-1 ml-2.5 text-[0.9rem] font-bold text-[var(--ink)] tracking-tight whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              InnoTicket
            </span>
            {!hideToggle && (
              <button
                onClick={toggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className={[
                  'shrink-0 w-6 h-6 rounded-md flex items-center justify-center',
                  'text-[var(--ink-light)] hover:text-[var(--ink)] hover:bg-[var(--ghost)]',
                  'transition-colors duration-150 outline-none',
                  'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
                ].join(' ')}
              >
                <PanelLeftClose size={14} strokeWidth={1.75} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 flex flex-col gap-0.5"
        aria-label="Main navigation"
      >
        {visibleEntries.map((entry) =>
          entry.type === 'item' ? (
            <SidebarItem
              key={entry.id}
              item={entry}
              collapsed={collapsed}
              onClick={onNavClick}
            />
          ) : (
            <SidebarGroup
              key={entry.id}
              group={entry}
              collapsed={collapsed}
              onChildClick={onNavClick}
            />
          ),
        )}

        {/* Divider before Jobs */}
        <div className="my-1 border-t border-[var(--border)]" />

        {/* Jobs — always last */}
        <SidebarItem
          item={NAV_JOBS}
          collapsed={collapsed}
          onClick={onNavClick}
        />
      </nav>

      {/* ── User Profile ───────────────────────────────────────── */}
      <UserProfile collapsed={collapsed} />
    </div>
  );
}
