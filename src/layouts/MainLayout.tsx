import { Outlet }       from 'react-router-dom';
import { Menu }          from 'lucide-react';
import { Sidebar }       from '../components/layout/Sidebar';
import { MobileDrawer }  from '../components/layout/MobileDrawer';
import { useUIStore }    from '../store/uiStore';

export function MainLayout() {
  const { toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      <MobileDrawer />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg)]">
          <Outlet />
        </main>
      </div>

      {/* Mobile-only floating hamburger — opens the drawer */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-5 right-5 z-50 md:hidden
                   w-11 h-11 flex items-center justify-center
                   rounded-full bg-[var(--sage)] text-white
                   shadow-[var(--shadow-lg)]
                   active:scale-95 transition-transform duration-150"
        aria-label="Open navigation menu"
      >
        <Menu size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
