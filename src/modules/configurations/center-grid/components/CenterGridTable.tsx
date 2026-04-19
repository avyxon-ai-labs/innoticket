import { useState }                           from 'react';
import { Eye, Pencil, Trash2, RefreshCw,
         Download }                           from 'lucide-react';
import { CenterGridExportDialog }             from './CenterGridExportDialog';
import { Table, type Column }             from '../../../../components/ui/Table';
import { Button }                         from '../../../../components/ui/Button';
import { Select }                         from '../../../../components/ui/Select';
import { cn, formatLocalDateTime }        from '../../../../utils';
import { useNavigationStore }             from '../../../../store/navigationStore';
import { useCenterGridList }              from '../hooks';
import { useCenterGridStore }             from '../store';
import type { CenterGridResponse }        from '../../../../services/center-grid.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [
  { value: '10',  label: '10 / page'  },
  { value: '25',  label: '25 / page'  },
  { value: '50',  label: '50 / page'  },
  { value: '100', label: '100 / page' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function CenterGridTable({ flat = false }: { flat?: boolean }) {
  const {
    filters, pagination, sortKey, sortDir,
    setPage, setSize, setSort,
    openEdit, openDelete,
  } = useCenterGridStore();

  const { pushView } = useNavigationStore();

  // ── Row selection (local state) ──────────────────────────────────────────
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [exportOpen,   setExportOpen]   = useState(false);

  function handleToggleSelect(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleSelectAll(keys: string[]) {
    setSelectedKeys(new Set(keys));
  }

  // Normalize — guard against stale non-array persisted data
  const projectCodes = Array.isArray(filters.projectCodes) ? filters.projectCodes : [];
  const hasProject   = projectCodes.length > 0;

  // Server-side filtered + paginated list
  const { data: page, isLoading, isFetching, refetch } =
    useCenterGridList(filters, pagination);

  const rows          = page?.content       ?? [];
  const totalElements = page?.totalElements ?? 0;
  const displayPage   = pagination.page + 1;

  function viewDetail(grid: CenterGridResponse) {
    pushView({
      module:     'center-grid',
      subView:    'detail',
      selectedId: String(grid.id),
    });
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<CenterGridResponse>[] = [
    {
      key:      'projectCode',
      label:    'Project',
      sortable: true,
      render:   (row) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--sage-light)]
                         text-[var(--sage)] font-semibold whitespace-nowrap">
          {row.projectCode}
        </span>
      ),
    },
    {
      key:      'centerName',
      label:    'Centre Name',
      sortable: true,
      render:   (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-[var(--ink)] whitespace-nowrap">{row.centerName}</span>
          <span className="font-mono text-[0.68rem] text-[var(--ink-light)]">{row.centerCode}</span>
        </div>
      ),
    },
    {
      key:      'city',
      label:    'Location',
      sortable: true,
      render:   (row) => (
        <span className="text-sm text-[var(--ink-mid)]">
          {[row.city, row.state].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      key:    'csupName',
      label:  'CSUP',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-[var(--ink-mid)]">{row.csupName || '—'}</span>
          {row.csupNumber && (
            <span className="text-[0.68rem] text-[var(--ink-light)]">{row.csupNumber}</span>
          )}
        </div>
      ),
    },
    {
      key:      'totalCandidate',
      label:    'Candidates',
      sortable: true,
      align:    'right',
      render:   (row) => (
        <span className="font-mono text-sm">{row.totalCandidate}</span>
      ),
    },
    {
      key:    'serviceMappings',
      label:  'Services',
      align:  'center',
      render: (row) => {
        const count = row.serviceMappings.length;
        return count > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem]
                           font-semibold bg-[var(--sage-light)] text-[var(--sage)]">
            {count} service{count !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-[var(--ink-light)]">—</span>
        );
      },
    },
    {
      key:      'createdAt',
      label:    'Created',
      sortable: true,
      render:   (row) => (
        <span className="text-xs text-[var(--ink-light)] whitespace-nowrap">
          {formatLocalDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key:   'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="View"
            onClick={(e) => { e.stopPropagation(); viewDetail(row); }}
            leftIcon={<Eye size={13} />}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Edit"
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            leftIcon={<Pencil size={13} />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete"
            onClick={(e) => { e.stopPropagation(); openDelete(row); }}
            leftIcon={<Trash2 size={13} />}
            className="text-[var(--red)] hover:bg-[var(--red-light)]"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className={cn(
        'flex items-center justify-between flex-wrap gap-2',
        flat
          ? 'px-4 py-3 border-b border-[var(--border)]'
          : 'px-0.5 pb-3',
      )}>
        <p className="text-xs text-[var(--ink-light)]">
          {isLoading ? 'Loading…' : `${totalElements} centre${totalElements !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={13} />}
            onClick={() => setExportOpen(true)}
            disabled={!hasProject}
            title="Export to Excel"
          >
            Export
          </Button>
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pagination.size)}
            onChange={(val) => setSize(Number(val))}
            wrapClass="w-32"
            size="sm"
          />
          <button
            onClick={() => refetch()}
            disabled={isFetching || !hasProject}
            title="Refresh"
            className="h-8 w-8 flex items-center justify-center rounded-[8px]
                       border border-[var(--border)] bg-[var(--ghost)]
                       text-[#3B82F6] hover:border-[#3B82F6] hover:bg-[#EFF6FF]
                       transition-colors duration-150 disabled:opacity-40"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {!hasProject && !isLoading && (
        <div className="rounded-[12px] border border-dashed border-[var(--border)] px-6 py-10 text-center">
          <p className="text-sm font-medium text-[var(--ink-mid)]">Select a project to view its centres</p>
          <p className="text-xs text-[var(--ink-light)] mt-1">Use the Project filter above to get started.</p>
        </div>
      )}

      {hasProject && (
        <Table
          data={rows}
          columns={columns}
          keyExtractor={(row) => String(row.id)}
          loading={isLoading}
          skeletonRows={8}
          emptyTitle="No centre grids found"
          emptyDescription="Create a centre grid to map services to examination centres."
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(key, dir) => { setSort(key, dir); setPage(0); }}
          page={displayPage}
          pageSize={pagination.size}
          total={totalElements}
          onPageChange={(p) => { setPage(p - 1); setSelectedKeys(new Set()); }}
          onRowClick={viewDetail}
          selectedKeys={selectedKeys}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          flat={flat}
        />
      )}

      <CenterGridExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
