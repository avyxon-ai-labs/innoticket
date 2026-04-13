import { useEffect, useState }    from 'react';
import { Plus, Upload }           from 'lucide-react';
import { Button }                 from '../components/ui/Button';
import { useNavigationStore }     from '../store/navigationStore';
import { useCenterGridStore }     from '../modules/configurations/center-grid/store';
import { CenterGridFilters }      from '../modules/configurations/center-grid/components/CenterGridFilters';
import { CenterGridTable }        from '../modules/configurations/center-grid/components/CenterGridTable';
import { CenterGridForm }         from '../modules/configurations/center-grid/components/CenterGridForm';
import { CenterGridDeleteDialog } from '../modules/configurations/center-grid/components/CenterGridDeleteDialog';
import { CenterGridDetail }       from '../modules/configurations/center-grid/components/CenterGridDetail';
import { BulkUploadDialog }       from '../modules/configurations/center-grid/components/BulkUploadDialog';

export function CenterGridPage() {
  const { current, resetStack } = useNavigationStore();
  const { openCreate }          = useCenterGridStore();
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    resetStack({ module: 'center-grid', subView: 'list' });
  }, [resetStack]);

  // ── Detail sub-view ────────────────────────────────────────────────────────

  if (current?.module === 'center-grid' && current.subView === 'detail' && current.selectedId) {
    return (
      <>
        <CenterGridDetail gridId={Number(current.selectedId)} />
        <CenterGridForm />
      </>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">
            Centre Grid
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage examination centres, CSUP contacts and service escalation mappings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload size={14} />}
            onClick={() => setBulkOpen(true)}
          >
            Bulk Upload
          </Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
            New Centre
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CenterGridFilters />

      {/* Table */}
      <div className="flex-1 min-h-0">
        <CenterGridTable />
      </div>

      {/* Modals */}
      <CenterGridForm />
      <CenterGridDeleteDialog />
      <BulkUploadDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  );
}
