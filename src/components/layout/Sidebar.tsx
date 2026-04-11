import { useUIStore } from '../../store/uiStore';
import { SidebarContent } from './SidebarContent';

export function Sidebar() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <aside
      className={[
        'hidden md:flex flex-col shrink-0 h-screen sticky top-0',
        'bg-[var(--surface)] border-r border-[var(--border)]',
        'transition-[width] duration-[250ms] ease-in-out overflow-hidden',
        sidebarCollapsed ? 'w-16' : 'w-[var(--sidebar-width)]',
      ].join(' ')}
    >
      <SidebarContent collapsed={sidebarCollapsed} />
    </aside>
  );
}
