import { Trash2, X, CheckSquare } from 'lucide-react';
import { Button }                  from '../../../components/ui/Button';
import { useJobStore }             from '../store';
import { useDeleteJobBatch }       from '../hooks';

// ── Component ─────────────────────────────────────────────────────────────────
// Inline action bar — rendered above the table card when ≥1 row is selected.

interface Props {
  /** Total rows on the current page, used for "select all on page" context */
  totalOnPage: number;
}

export function JobBulkActionBar({ totalOnPage }: Props) {
  const { selectedIds, clearSelection, selectAll } = useJobStore();
  const deleteMut = useDeleteJobBatch();

  const count = selectedIds.size;
  if (count === 0) return null;

  const allPageSelected = totalOnPage > 0 && count >= totalOnPage;

  async function handleDelete() {
    if (!confirm(`Delete ${count} job${count !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    try {
      await deleteMut.mutateAsync([...selectedIds]);
      clearSelection();
    } catch {
      // Axios interceptor handles toast
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5
                 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[12px]
                 animate-[fadeSlideDown_0.18s_ease-out]"
    >
      {/* Selection indicator */}
      <CheckSquare size={15} className="text-[#1D4ED8] shrink-0" />
      <span className="text-sm font-semibold text-[#1D4ED8]">
        {count} selected
      </span>

      {/* Select-all hint when only some are selected */}
      {!allPageSelected && totalOnPage > 0 && (
        <span className="text-xs text-[#3B82F6]">
          · {totalOnPage} on page
        </span>
      )}

      {/* Divider */}
      <div className="w-px h-4 bg-[#BFDBFE] mx-1" />

      {/* Delete */}
      <Button
        variant="danger"
        size="sm"
        loading={deleteMut.isPending}
        leftIcon={<Trash2 size={13} />}
        onClick={handleDelete}
      >
        Delete selected
      </Button>

      {/* Clear */}
      <button
        onClick={clearSelection}
        className="ml-auto p-1.5 rounded-[8px] text-[#3B82F6] hover:text-[#1D4ED8]
                   hover:bg-[#DBEAFE] transition-colors"
        aria-label="Clear selection"
      >
        <X size={14} />
      </button>
    </div>
  );
}
