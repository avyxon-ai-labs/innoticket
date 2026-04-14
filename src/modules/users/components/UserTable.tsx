import { Pencil, Trash2, Eye, RefreshCw } from 'lucide-react';
import { Table, type Column }             from '../../../components/ui/Table';
import { Badge }                          from '../../../components/ui/Badge';
import { Button }                         from '../../../components/ui/Button';
import { Select }                         from '../../../components/ui/Select';
import { formatLocalDateTime }            from '../../../utils';
import { useNavigationStore }             from '../../../store/navigationStore';
import { useUsers }                       from '../hooks';
import { useUserStore }                   from '../store';
import type { UserResponse }              from '../../../services/user.service';
import type { UserFilters }               from '../../../services/user.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [
  { value: '10',   label: '10 / page'   },
  { value: '25',   label: '25 / page'   },
  { value: '50',   label: '50 / page'   },
  { value: '500',  label: '500 / page'  },
  { value: '1000', label: '1000 / page' },
];

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  ADMIN:  { bg: '#FEF3C7', text: '#D97706' },
  USER:   { bg: '#EFF6FF', text: '#2563EB' },
  CLIENT: { bg: '#F0FDF4', text: '#16A34A' },
};

// ── Sub-component: Role pill ──────────────────────────────────────────────────

function RolePill({ role }: { role: string }) {
  const cfg = ROLE_BADGE[role] ?? { bg: 'var(--ghost)', text: 'var(--ink-mid)' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.68rem] font-semibold tracking-wide font-mono"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {role}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UserTable({ flat = false }: { flat?: boolean }) {
  const {
    filters, pagination, sortKey, sortDir,
    setPage, setSize, setSort,
    openEdit, openDelete,
  } = useUserStore();

  const { pushView } = useNavigationStore();

  const queryFilters: UserFilters = {
    page:      pagination.page,
    size:      pagination.size,
    sort:      sortKey,
    direction: sortDir,
    ...(filters.search                  && { search:     filters.search                      }),
    ...(filters.status                  && { status:     filters.status                      }),
    ...(filters.roleCodes?.length       && { roleCodes:  filters.roleCodes.join(',')          }),
  };

  const { data, isLoading, isFetching, refetch } = useUsers(queryFilters);

  const rows          = data?.content       ?? [];
  const totalElements = data?.totalElements ?? 0;
  const displayPage   = pagination.page + 1;

  function viewDetail(user: UserResponse) {
    pushView({ module: 'users', subView: 'detail', selectedId: String(user.id) });
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<UserResponse>[] = [
    {
      key:      'fullName',
      label:    'Full Name',
      sortable: true,
      render:   (row) => (
        <span className="font-medium text-[var(--ink)] whitespace-nowrap">{row.fullName}</span>
      ),
    },
    {
      key:      'post',
      label:    'Post',
      sortable: true,
      render:   (row) => (
        <span className="text-sm text-[var(--ink-mid)] whitespace-nowrap">{row.post || '—'}</span>
      ),
    },
    {
      key:      'username',
      label:    'Username',
      sortable: true,
      render:   (row) => (
        <span className="font-mono text-xs text-[var(--ink-mid)]">{row.username}</span>
      ),
    },
    {
      key:    'contact',
      label:  'Contact',
      render: (row) => (
        <span className="text-sm text-[var(--ink-mid)]">{row.contact || '—'}</span>
      ),
    },
    {
      key:    'roleCode',
      label:  'Role',
      render: (row) => <RolePill role={row.roleCode} />,
    },
    {
      key:    'status',
      label:  'Status',
      render: (row) => (
        <Badge
          variant={row.status === 'ACTIVE' ? 'open' : 'closed'}
          label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key:      'lastLogin',
      label:    'Last Login',
      sortable: true,
      render:   (row) => (
        <span className="text-xs text-[var(--ink-light)] whitespace-nowrap">
          {row.lastLogin ? formatLocalDateTime(row.lastLogin) : 'Never'}
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
            aria-label="View user"
            onClick={(e) => { e.stopPropagation(); viewDetail(row); }}
            leftIcon={<Eye size={13} />}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Edit user"
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            leftIcon={<Pencil size={13} />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete user"
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
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-xs text-[var(--ink-light)]">
          {isLoading ? 'Loading…' : `${totalElements} user${totalElements !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-2">
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pagination.size)}
            onChange={(val) => setSize(Number(val))}
            wrapClass="w-32"
            size="sm"
          />
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
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters."
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(key, dir) => { setSort(key, dir); setPage(0); }}
        page={displayPage}
        pageSize={pagination.size}
        total={totalElements}
        onPageChange={(p) => setPage(p - 1)}
        onRowClick={viewDetail}
        flat={flat}
      />
    </div>
  );
}
