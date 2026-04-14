import { useState }                  from 'react';
import { Pencil, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Table, type Column }        from '../../../../components/ui/Table';
import { Badge }                     from '../../../../components/ui/Badge';
import { Button }                    from '../../../../components/ui/Button';
import { Select }                    from '../../../../components/ui/Select';
import { formatLocalDateTime }       from '../../../../utils';
import { useProjects }               from '../hooks';
import { useProjectStore }           from '../store';
import type { Project }              from '../../../../services/project.service';
import type { ProjectFilters }       from '../../../../services/project.service';

// ── Password cell ─────────────────────────────────────────────────────────────

function PasswordCell({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-sm text-[var(--ink-mid)]">
        {visible ? value : '••••••••'}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setVisible((v) => !v); }}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="p-0.5 rounded text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors duration-150"
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [
  { value: '10',  label: '10 / page'  },
  { value: '200', label: '200 / page' },
  { value: '500', label: '500 / page' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectTable({ flat = false }: { flat?: boolean }) {
  const {
    filters, pagination, sortKey, sortDir,
    setPage, setSize, setSort,
    openEdit, openDelete,
  } = useProjectStore();

  // Build query params — drop empty strings
  const queryFilters: ProjectFilters = {
    page:       pagination.page,
    size:       pagination.size,
    ...(filters.status     && { status:     filters.status     }),
    ...(filters.searchText && { searchText: filters.searchText }),
  };

  const { data, isLoading, isFetching, refetch } = useProjects(queryFilters);

  const rows         = data?.content        ?? [];
  const totalElements = data?.totalElements ?? 0;
  // Convert 0-indexed API page → 1-indexed for Table component
  const displayPage  = pagination.page + 1;

  // ── Columns ──────────────────────────────────────────────────────────────────

  const columns: Column<Project>[] = [
    {
      key:      'projectName',
      label:    'Project Name',
      sortable: true,
      render:   (row) => (
        <span className="font-medium text-[var(--ink)]">{row.projectName}</span>
      ),
    },
    {
      key:      'projectCode',
      label:    'Code',
      sortable: true,
      render:   (row) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--ghost)] border border-[var(--border)] text-[var(--ink-mid)]">
          {row.projectCode}
        </span>
      ),
    },
    {
      key:    'password',
      label:  'Password',
      render: (row) => <PasswordCell value={row.password} />,
    },
    {
      key:      'status',
      label:    'Status',
      sortable: true,
      render:   (row) => (
        <Badge
          variant={row.status === 'ACTIVE' ? 'open' : 'closed'}
          label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key:      'slaLevel1Hours',
      label:    'SLA L1 (hrs)',
      sortable: true,
      align:    'right',
      render:   (row) => (
        <span className="font-mono text-sm">{row.slaLevel1Hours}</span>
      ),
    },
    {
      key:      'slaLevel2Hours',
      label:    'SLA L2 (hrs)',
      sortable: true,
      align:    'right',
      render:   (row) => (
        <span className="font-mono text-sm">{row.slaLevel2Hours}</span>
      ),
    },
    {
      key:    'createdBy',
      label:  'Created By',
      render: (row) => (
        <span className="text-xs text-[var(--ink-light)]">{row.createdBy}</span>
      ),
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
            aria-label="Edit project"
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            leftIcon={<Pencil size={13} />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete project"
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-xs text-[var(--ink-light)]">
          {isLoading ? 'Loading…' : `${totalElements} project${totalElements !== 1 ? 's' : ''}`}
        </p>

        <div className="flex items-center gap-2">
          {/* Page size selector */}
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pagination.size)}
            onChange={(val) => setSize(Number(val))}
            wrapClass="w-32"
            size="sm"
          />

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
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

      <Table
        data={rows}
        columns={columns}
        keyExtractor={(row) => String(row.id)}
        loading={isLoading}
        skeletonRows={8}
        emptyTitle="No projects found"
        emptyDescription="Create your first project to get started."
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(key, dir) => { setSort(key, dir); setPage(0); }}
        page={displayPage}
        pageSize={pagination.size}
        total={totalElements}
        onPageChange={(p) => setPage(p - 1)}   // Table is 1-indexed; API is 0-indexed
        flat={flat}
      />
    </div>
  );
}
