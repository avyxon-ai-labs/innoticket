import { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { SidebarContent } from './SidebarContent';

export function MobileDrawer() {
  const { sidebarOpen, closeSidebar } = useUIStore();

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-30 md:hidden transition-opacity duration-250',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ background: 'rgba(15,17,23,0.4)', backdropFilter: 'blur(3px)' }}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Drawer panel — always fully expanded on mobile */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex flex-col md:hidden',
          'w-[var(--sidebar-width)] bg-[var(--surface)] border-r border-[var(--border)]',
          'transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={sidebarOpen ? { boxShadow: 'var(--shadow-lg)' } : undefined}
        aria-label="Navigation"
      >
        <SidebarContent collapsed={false} onNavClick={closeSidebar} hideToggle />
      </aside>
    </>
  );
}
