interface AuthCardProps {
  title?:    string;
  subtitle?: string;
  children:  React.ReactNode;
}

/**
 * Shared wrapper used by every auth page.
 * Brand mark lives HERE so switching pages never shifts position —
 * the card is always the same width and the brand is always at the top.
 */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[420px] animate-[fadeUp_0.22s_cubic-bezier(0.34,1.4,0.64,1)]">
      {/* ── Card ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow-md)] overflow-hidden">

        {/* Brand header — always present, always same height → no layout shift */}
        <div className="flex items-center gap-2.5 px-7 pt-7 pb-5 border-b border-[var(--border)]">
          <div className="w-8 h-8 rounded-[9px] bg-[var(--ink)] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
              IT
            </span>
          </div>
          <span
            className="text-[0.95rem] font-bold text-[var(--ink)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {import.meta.env.VITE_APP_NAME}
          </span>
        </div>

        {/* Body */}
        <div className="px-7 py-6 flex flex-col gap-5">
          {/* Title block — only renders when provided */}
          {(title || subtitle) && (
            <div className="flex flex-col gap-1">
              {title && (
                <h1
                  className="text-[1.3rem] font-bold text-[var(--ink)] tracking-tight leading-snug"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-[var(--ink-light)] leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-[11px] text-[var(--ink-light)] mt-5 leading-relaxed">
        Protected by end-to-end encryption.
      </p>
    </div>
  );
}
