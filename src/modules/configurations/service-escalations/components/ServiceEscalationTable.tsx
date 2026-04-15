import { useState }                  from 'react';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Table, type Column }        from '../../../../components/ui/Table';
import { Badge }                     from '../../../../components/ui/Badge';
import { Button }                    from '../../../../components/ui/Button';
import { formatLocalDateTime }       from '../../../../utils';
import { useServiceEscalations,
         useDeleteServiceEscalation } from '../hooks';
import { useServiceEscalationStore } from '../store';
import type { ServiceEscalation }    from '../../../../services/service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'serviceName' | 'escalationType' | 'slaLevel1Minutes' | 'slaLevel2Minutes' | 'createdAt';
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

/** Format minutes as a compact label, e.g. 90 → "90m", 60 → "1h", 120 → "2h" */
function fmtMinutes(m: number): string {
  if (m === 0) return '—';
  if (m % 60 === 0) return `${m / 60}h`;
  if (m > 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceEscalationTable({ flat = false }: { flat?: boolean }) {
  const { filters, openEdit }   = useServiceEscalationStore();
  const deleteMut               = useDeleteServiceEscalation();

  const [sortKey, setSortKey]   = useState<SortKey>('createdAt');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');
  const [page,    setPage]      = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null); // pending-confirm row
  const PAGE_SIZE = 10;

  const { data, isLoading, isFetching, refetch } = useServiceEscalations(filters);

  // ── Sort + paginate ────────────────────────────────────────────────────────
  const sorted = data ? sortRows(data, sortKey, sortDir) : [];
  const total  = sorted.length;
  const paged  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: string, dir: 'asc' | 'desc') {
    setSortKey(key as SortKey);
    setSortDir(dir);
    setPage(1);
  }

  async function handleDelete(id: number) {
    try {
      await deleteMut.mutateAsync(id);
    } catch {
      // Global error toast handled by Axios interceptor
    } finally {
      setDeleteId(null);
    }
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
      key:      'slaLevel1Minutes',
      label:    'SLA L1',
      sortable: true,
      render:   (row) => (
        <span className="text-xs font-mono text-[var(--ink)] tabular-nums">
          {fmtMinutes(row.slaLevel1Minutes)}
        </span>
      ),
    },
    {
      key:      'slaLevel2Minutes',
      label:    'SLA L2',
      sortable: true,
      render:   (row) => (
        <span className="text-xs font-mono text-[var(--ink)] tabular-nums">
          {fmtMinutes(row.slaLevel2Minutes)}
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
      render: (row) => {
        const confirming = deleteId === row.id;
        const deleting   = deleteMut.isPending && deleteId === row.id;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Edit"
              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              leftIcon={<Pencil size={13} />}
            >
              Edit
            </Button>

            {confirming ? (
              /* Inline confirm state */
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                  disabled={deleting}
                  className="h-7 px-2 rounded-[6px] text-[0.68rem] font-semibold
                             bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]
                             hover:bg-[#FEE2E2] disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(null); }}
                  disabled={deleting}
                  className="h-7 px-2 rounded-[6px] text-[0.68rem] font-semibold
                             text-[var(--ink-light)] hover:bg-[var(--ghost)]
                             disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                aria-label="Delete"
                onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}
                leftIcon={<Trash2 size={13} className="text-[#EF4444]" />}
              >
                <span className="text-[#EF4444]">Delete</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar: count + refresh */}
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs text-[var(--ink-light)]">
          {isLoading ? 'Loading…' : `${total} record${total !== 1 ? 's' : ''}`}
        </p>
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

      <Table
        data={paged}
        columns={columns}
        keyExtractor={(row) => String(row.id)}
        loading={isLoading}
        skeletonRows={8}
        emptyTitle="No escalation configs"
        emptyDescription="Add a new config to get started."
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        flat={flat}
      />
    </div>
  );
}
