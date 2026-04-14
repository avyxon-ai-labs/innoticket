import { clsx, type ClassValue } from 'clsx';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format ISO date → "Apr 12, 2025" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Truncate a string to maxLen chars */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Convert a UTC ISO string to the browser's local date/time.
 * Returns e.g. "Apr 11, 2026, 3:45 PM"
 */
export function formatLocalDateTime(utcIso: string): string {
  if (!utcIso) return '—';
  const date = new Date(
    utcIso.endsWith('Z') ? utcIso : utcIso + 'Z',
  );
  return new Intl.DateTimeFormat('en-US', {
    month:  'short',
    day:    'numeric',
    year:   'numeric',
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Convert total minutes to a human-readable string.
 * e.g. 90 → "1h 30m", 45 → "45m", 1500 → "1d 1h"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '—';
  const days  = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins  = minutes % 60;
  if (days > 0)  return `${days}d ${hours > 0 ? `${hours}h` : ''}`.trim();
  if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  return `${mins}m`;
}

/**
 * Compute how long a ticket was / has been active.
 *
 * Logic:
 *  - activeSince null/empty          → null (never became active)
 *  - activeSince set, activeEndedAt null  → diff vs. now (still running)
 *  - both set                         → diff between the two instants
 *
 * Auto-scales: <1m → "Xm" → "Xh Ym" → "Xd Yh"
 */
export function formatActiveDuration(
  activeSinceIso:   string | null | undefined,
  activeEndedAtIso?: string | null,
): string | null {
  if (!activeSinceIso) return null;

  const toMs = (iso: string) =>
    new Date(iso.endsWith('Z') ? iso : iso + 'Z').getTime();

  const sinceMs = toMs(activeSinceIso);
  const endMs   = activeEndedAtIso ? toMs(activeEndedAtIso) : Date.now();
  const diffMs  = endMs - sinceMs;

  if (diffMs < 0) return null;

  const totalMins = Math.floor(diffMs / 60_000);
  const hours     = Math.floor(totalMins / 60);
  const mins      = totalMins % 60;
  const days      = Math.floor(hours / 24);
  const remHours  = hours % 24;

  if (days  > 0) return `${days}d ${remHours > 0 ? `${remHours}h` : ''}`.trim();
  if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  if (totalMins > 0) return `${totalMins}m`;
  return '<1m';
}

/**
 * Compute SLA countdown from a deadline ISO string vs now.
 * Returns { label, breached, urgent }
 * - breached: deadline has passed
 * - urgent: less than 2 hours remaining
 */
export function formatSlaCountdown(deadlineIso: string): {
  label:    string;
  breached: boolean;
  urgent:   boolean;
} {
  if (!deadlineIso) return { label: '—', breached: false, urgent: false };

  const deadline = new Date(
    deadlineIso.endsWith('Z') ? deadlineIso : deadlineIso + 'Z',
  ).getTime();
  const diffMs = deadline - Date.now();

  if (diffMs <= 0) return { label: 'Breached', breached: true, urgent: true };

  const totalMins = Math.floor(diffMs / 60_000);
  const hours     = Math.floor(totalMins / 60);
  const mins      = totalMins % 60;
  const days      = Math.floor(hours / 24);
  const remHours  = hours % 24;

  let label: string;
  if (days > 0)       label = `${days}d ${remHours > 0 ? `${remHours}h` : ''} left`.trim();
  else if (hours > 0) label = `${hours}h ${mins > 0 ? `${mins}m` : ''} left`.trim();
  else                label = `${mins}m left`;

  return { label, breached: false, urgent: hours < 2 };
}
