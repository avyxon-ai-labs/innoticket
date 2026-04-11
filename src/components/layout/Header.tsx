import { Menu, Search, Bell } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export function Header() {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-[var(--header-height)] px-4 border-b border-[var(--border)] bg-[var(--surface)]">
      {/* Left: hamburger (mobile only) */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-[8px] text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Right: search + notifications */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[var(--ghost)] border border-[var(--border)] text-[var(--ink-light)] text-sm hover:border-[var(--sage-mid)] transition-colors"
          aria-label="Search"
        >
          <Search size={14} />
          <span className="hidden sm:inline text-xs text-[var(--ink-light)]">Search…</span>
          <kbd className="hidden sm:inline text-[11px] text-[var(--ink-light)] border border-[var(--border)] rounded-[4px] px-1 py-0.5 leading-none font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          className="relative p-1.5 rounded-[8px] text-[var(--ink-light)] hover:bg-[var(--ghost)] hover:text-[var(--ink)] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--sage)]"
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
