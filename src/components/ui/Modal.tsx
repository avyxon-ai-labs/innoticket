import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open:         boolean;
  onClose:      () => void;
  title?:       string;
  description?: string;
  size?:        ModalSize;
  /** Clicking backdrop closes modal (default true) */
  closeOnBackdrop?: boolean;
  children:     React.ReactNode;
  footer?:      React.ReactNode;
}

const sizeMap: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  closeOnBackdrop = true,
  children,
  footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Focus trap on open
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-[fadeUp_0.15s_ease-out]"
        style={{ background: 'rgba(15,17,23,0.42)', backdropFilter: 'blur(4px)' }}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-[var(--surface)] outline-none z-10',
          'rounded-t-[20px] sm:rounded-[20px]',
          'shadow-[var(--shadow-lg)]',
          'animate-[slideUp_0.28s_cubic-bezier(0.34,1.4,0.64,1)] sm:animate-[modalIn_0.22s_cubic-bezier(0.34,1.4,0.64,1)]',
          sizeMap[size],
        )}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-base font-semibold text-[var(--ink)] tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-[var(--ink-light)] mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className={cn(
                'ml-4 shrink-0 p-1.5 rounded-[8px] text-[var(--ink-light)]',
                'hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
                'transition-colors duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
              )}
              aria-label="Close"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto max-h-[60vh]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-[var(--border)] flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
