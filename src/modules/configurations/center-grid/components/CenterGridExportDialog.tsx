import { useState }                  from 'react';
import { Download, X, Filter }       from 'lucide-react';
import { createPortal }              from 'react-dom';
import { cn }                        from '../../../../utils';
import { Button }                    from '../../../../components/ui/Button';
import { centerGridService }         from '../../../../services/center-grid.service';
import { useCenterGridStore }        from '../store';

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function FilterChip({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="shrink-0 font-semibold text-[var(--ink-mid)] w-24">{label}</span>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v}
            className="px-2 py-0.5 rounded-full bg-[var(--sage-light)] border border-[var(--sage)]/30
                       text-[var(--sage)] text-[0.65rem] font-medium leading-none">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CenterGridExportDialog({ open, onClose }: Props) {
  const { filters } = useCenterGridStore();
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  if (!open) return null;

  const projectCodes = Array.isArray(filters.projectCodes) ? filters.projectCodes : [];
  const centerCodes  = Array.isArray(filters.centerCodes)  ? filters.centerCodes  : [];
  const serviceNames = Array.isArray(filters.serviceNames) ? filters.serviceNames : [];
  const search       = filters.search ?? '';

  const hasFilters = projectCodes.length > 0 || centerCodes.length > 0 ||
                     serviceNames.length > 0 || !!search;

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await centerGridService.export({
        projectCodes: projectCodes.length ? projectCodes : undefined,
        centerCodes:  centerCodes.length  ? centerCodes  : undefined,
        serviceNames: serviceNames.length ? serviceNames : undefined,
        search:       search || undefined,
      });

      // Trigger browser download from blob
      const blob = new Blob([res.data as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'center_grids_export.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog" aria-modal="true" aria-label="Export Centre Grid"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(15,17,23,0.42)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={cn(
        'relative w-full max-w-md bg-[var(--surface)] z-10 outline-none',
        'rounded-t-[20px] sm:rounded-[20px] shadow-[var(--shadow-lg)]',
        'animate-[slideUp_0.28s_cubic-bezier(0.34,1.4,0.64,1)] sm:animate-[modalIn_0.22s_cubic-bezier(0.34,1.4,0.64,1)]',
      )}>
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]"
                style={{ fontFamily: 'var(--font-display)' }}>
              Export Centre Grid
            </h2>
            <p className="text-xs text-[var(--ink-light)] mt-0.5">
              Downloads as <span className="font-semibold text-[var(--ink)]">.xlsx</span>
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="ml-4 shrink-0 p-1.5 rounded-[8px] text-[var(--ink-light)]
                       hover:bg-[var(--ghost)] hover:text-[var(--ink)] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Filter summary */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-[var(--ink-light)]" />
            <span className="text-xs font-semibold text-[var(--ink-mid)]">Applied Filters</span>
          </div>

          {hasFilters ? (
            <div className="flex flex-col gap-2.5 p-3 rounded-[10px]
                            bg-[var(--ghost)] border border-[var(--border)]">
              <FilterChip label="Projects"  values={projectCodes} />
              <FilterChip label="Centres"   values={centerCodes}  />
              <FilterChip label="Services"  values={serviceNames} />
              {search && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 font-semibold text-[var(--ink-mid)] w-24">Search</span>
                  <span className="text-[var(--ink)] italic">"{search}"</span>
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2.5 rounded-[10px] bg-[var(--ghost)] border border-[var(--border)]">
              <p className="text-xs text-[var(--ink-light)]">
                No filters applied — <span className="font-semibold text-[var(--ink)]">all records</span> will be exported.
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-[#DC2626] font-medium">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            leftIcon={<Download size={13} />}
            loading={loading}
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
