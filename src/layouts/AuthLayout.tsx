import { Outlet } from 'react-router-dom';

/**
 * Shell for all unauthenticated pages.
 * Fixes: w-full + flex-1 so it fills the #root flex-row container.
 * Brand mark lives inside each page card — not here — so switching
 * pages never shifts the vertical position.
 */
export function AuthLayout() {
  return (
    <div
      className={[
        // Must fill the #root flex container (which is display:flex row)
        'w-full flex-1',
        // Center child card
        'flex flex-col items-center justify-center',
        'min-h-screen px-4 py-10',
        // Background with very subtle sage tint at top
      ].join(' ')}
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -10%, #edf4ef 0%, var(--ghost) 70%)',
      }}
    >
      <Outlet />
    </div>
  );
}
