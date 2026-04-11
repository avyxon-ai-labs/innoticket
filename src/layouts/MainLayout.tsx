import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MobileDrawer } from '../components/layout/MobileDrawer';

export function MainLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      <MobileDrawer />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--surface)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
