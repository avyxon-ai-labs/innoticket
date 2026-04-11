import { useState }               from 'react';
import { Pencil, RefreshCw }      from 'lucide-react';
import { Table, type Column }     from '../../../../components/ui/Table';
import { Badge }                  from '../../../../components/ui/Badge';
import { Button }                 from '../../../../components/ui/Button';
import { formatLocalDateTime }    from '../../../../utils';
import { useServiceEscalations }  from '../hooks';
import { useServiceEscalationStore } from '../store';
import type { ServiceEscalation } from '../../../../services/service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'serviceName' | 'escalationType' | 'createdAt';
type SortDir = 'asc' | 'desc';

// ── Helpers ───────────────────────────────────────────────────────────────────

function sortRows(rows: ServiceEscalation[], key: SortKey, dir: SortDir) {
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    const cmp = av < bv ? -1 : 1;
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceEscalationTable() {
  const { filters, openEdit } = useServiceEscalationStore();

  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page,    setPage]    = useState(1);
  const PAGE_SIZE = 10;

  const { data, isLoading, isFetching, refetch } = useServiceEscalations(filters);

  // ── Sort + paginate client-side (API returns flat array) ───────────────────
  const sorted  = data ? sortRows(data, sortKey, sortDir) : [];
  const total   = sorted.length;
  const paged   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: string, dir: 'asc' | 'desc') {
    setSortKey(key as SortKey);
    setSortDir(dir);
    setPage(1);
  }

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<ServiceEscalation>[] = [
    {
      key:      'serviceName',
      label:    'Service Name',
      sortable: true,
      render:   (row) => (
        <span className="font-medium text-[var(--ink)]">{row.serviceName}</span>
      ),
    },
    {
      key:      'escalationType',
      label:    'Escalation Type',
      sortable: true,
      render:   (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold
                         bg-[var(--sage-light)] text-[var(--sage)] font-mono tracking-wide">
          {row.escalationType}
        </span>
      ),
    },
    {
      key:    'active',
      label:  'Status',
      render: (row) => (
        <Badge
          variant={row.active ? 'open' : 'closed'}
          label={row.active ? 'Active' : 'Inactive'}
        />
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
      key:    'actions',
      label:  '',
      align:  'right',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Edit"
          onClick={(e) => { e.stopPropagation(); openEdit(row); }}
          leftIcon={<Pencil size={13} />}
        >
          Edit
        </Button>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Table toolbar: record count + refresh */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-xs text-[var(--ink-light)]">
          {isLoading ? 'Loading…' : `${total} record${total !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
          className="p-1.5 rounded-lg text-[var(--ink-light)] hover:bg-[var(--ghost)]
                     hover:text-[var(--ink)] transition-colors duration-150 disabled:opacity-40"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <Table
        data={paged}
        columns={columns}
        keyExtractor={(row) => String(row.id)}
        loading={isLoading}
        skeletonRows={8}
        emptyTitle="No service escalations"
        emptyDescription="Add a new rule to get started."
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
