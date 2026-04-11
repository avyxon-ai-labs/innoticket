import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Props {
  collapsed: boolean;
}

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserProfile({ collapsed }: Props) {
  const navigate         = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen]  = useState(false);
  const ref              = useRef<HTMLDivElement>(null);

  const fullName = user?.fullName ?? 'User';
  const email    = user?.email    ?? '';
  const role     = user?.role     ?? '';
  const initials = getInitials(fullName);

  // ── Close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Close on Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // ── Menu actions ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      onClick: () => setOpen(false),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => setOpen(false),
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: LogOut,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div ref={ref} className="relative px-2 pb-3 pt-2 border-t border-[var(--border)]">
      {/* ── Dropdown — appears ABOVE the button ─────────────────────────── */}
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-md)] py-1 z-50 animate-[fadeUp_0.15s_ease-out]">
          {/* User info header */}
          <div className="px-3 py-2.5 border-b border-[var(--border)] mb-1">
            <p className="text-xs font-semibold text-[var(--ink)] truncate">{fullName}</p>
            <p className="text-[11px] text-[var(--ink-light)] truncate">{email}</p>
            {role && (
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[var(--sage-light)] text-[var(--sage)]">
                {role}
              </span>
            )}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium',
                  'transition-colors duration-100 outline-none',
                  'focus-visible:bg-[var(--ghost)]',
                  item.danger
                    ? 'text-[var(--red)] hover:bg-[var(--red-light)]'
                    : 'text-[var(--ink-mid)] hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
                ].join(' ')}
              >
                <Icon size={14} strokeWidth={1.75} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Profile trigger button ───────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? fullName : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          'w-full flex items-center rounded-xl transition-colors duration-150 outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
          collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2.5',
          open ? 'bg-[var(--ghost)]' : 'hover:bg-[var(--ghost)]',
        ].join(' ')}
      >
        {/* Avatar */}
        <span
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 text-white text-xs font-bold leading-none"
          style={{ background: 'linear-gradient(135deg, var(--sage), var(--ink))' }}
          aria-hidden="true"
        >
          {initials}
        </span>

        {!collapsed && (
          <>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-[0.8rem] font-semibold text-[var(--ink)] truncate leading-snug">
                {fullName}
              </span>
              <span className="text-[0.68rem] text-[var(--ink-light)] truncate leading-none mt-0.5">
                {email}
              </span>
              {role && (
                <span className="text-[0.65rem] font-semibold text-[var(--sage)] uppercase tracking-wide mt-0.5">
                  {role}
                </span>
              )}
            </div>
            <ChevronUp
              size={13}
              strokeWidth={2}
              className={[
                'shrink-0 text-[var(--ink-light)] transition-transform duration-200',
                open ? 'rotate-0' : 'rotate-180',
              ].join(' ')}
            />
          </>
        )}
      </button>
    </div>
  );
}
