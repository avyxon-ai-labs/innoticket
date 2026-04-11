import { AlertTriangle }    from 'lucide-react';
import { Modal }            from '../../../../components/ui/Modal';
import { Button }           from '../../../../components/ui/Button';
import { useDeleteProject } from '../hooks';
import { useProjectStore }  from '../store';

export function ProjectDeleteDialog() {
  const { deleteTarget, closeDelete } = useProjectStore();
  const deleteMut = useDeleteProject();

  async function handleConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      closeDelete();
    } catch {
      // Axios interceptor handles error
    }
  }

  return (
    <Modal
      open={!!deleteTarget}
      onClose={closeDelete}
      title="Delete Project"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={closeDelete} disabled={deleteMut.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteMut.isPending}
            onClick={handleConfirm}
          >
            Delete
          </Button>
        </div>
      }
    >
      <div className="flex gap-3">
        <div className="shrink-0 w-9 h-9 rounded-[10px] bg-[var(--red-light)] flex items-center justify-center">
          <AlertTriangle size={16} className="text-[var(--red)]" />
        </div>
        <div>
          <p className="text-sm text-[var(--ink)]">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{deleteTarget?.projectName}</span>?
          </p>
          <p className="mt-1 text-xs text-[var(--ink-light)]">
            This action cannot be undone.
          </p>
        </div>
      </div>
    </Modal>
  );
}
