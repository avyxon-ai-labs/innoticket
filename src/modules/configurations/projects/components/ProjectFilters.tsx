import { Search, X }        from 'lucide-react';
import { Input }             from '../../../../components/ui/Input';
import { Select }            from '../../../../components/ui/Select';
import { Button }            from '../../../../components/ui/Button';
import { useProjectStore }   from '../store';

const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function ProjectFilters() {
  const { filters, setFilter, clearFilters } = useProjectStore();
  const hasActive = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        placeholder="Search projects…"
        value={filters.searchText ?? ''}
        onChange={(e) => setFilter('searchText', e.target.value)}
        leftIcon={<Search size={14} />}
        wrapClass="w-56"
      />

      <Select
        placeholder="All statuses"
        options={STATUS_OPTIONS}
        value={filters.status ?? ''}
        onChange={(val) => setFilter('status', val as typeof filters.status)}
        wrapClass="w-40"
      />

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          leftIcon={<X size={13} />}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
