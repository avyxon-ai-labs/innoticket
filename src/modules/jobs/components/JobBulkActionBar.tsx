import { useState }                from 'react';
import { Trash2, X, CheckSquare } from 'lucide-react';
import { Button }                  from '../../../components/ui/Button';
import { Modal }                   from '../../../components/ui/Modal';
import { useJobStore }             from '../store';
import { useDeleteJobBatch }       from '../hooks';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  totalOnPage: number;
}

export function JobBulkActionBar({ totalOnPage }: Props) {
  const { selectedIds, clearSelection, selectAll } = useJobStore();
  const deleteMut = useDeleteJobBatch();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const count = selectedIds.size;
  if (count === 0) return null;

  const allPageSelected = totalOnPage > 0 && count >= totalOnPage;

  async function handleConfirmDelete() {
    try {
      await deleteMut.mutateAsync([...selectedIds]);
      clearSelection();
      setConfirmOpen(false);
    } catch {
      // Axios interceptor handles toast
    }
  }

  return (
    <>
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

        {!allPageSelected && totalOnPage > 0 && (
          <span className="text-xs text-[#3B82F6]">
            · {totalOnPage} on page
          </span>
        )}

        <div className="w-px h-4 bg-[#BFDBFE] mx-1" />

        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 size={13} />}
          onClick={() => setConfirmOpen(true)}
          disabled={deleteMut.isPending}
        >
          Delete selected
        </Button>

        <button
          onClick={clearSelection}
          className="ml-auto p-1.5 rounded-[8px] text-[#3B82F6] hover:text-[#1D4ED8]
                     hover:bg-[#DBEAFE] transition-colors"
          aria-label="Clear selection"
        >
          <X size={14} />
        </button>
      </div>

      {/* Confirmation modal */}
      <Modal
        open={confirmOpen}
        onClose={() => !deleteMut.isPending && setConfirmOpen(false)}
        title="Delete jobs?"
        description={`You are about to permanently delete ${count} job record${count !== 1 ? 's' : ''}. This cannot be undone.`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={deleteMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMut.isPending}
              leftIcon={<Trash2 size={13} />}
              onClick={handleConfirmDelete}
            >
              Delete {count} job{count !== 1 ? 's' : ''}
            </Button>
          </div>
        }
      />
    </>
  );
}
