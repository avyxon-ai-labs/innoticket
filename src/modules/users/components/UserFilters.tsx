import { Search, X }     from 'lucide-react';
import { Input }          from '../../../components/ui/Input';
import { Select }         from '../../../components/ui/Select';
import { Button }         from '../../../components/ui/Button';
import { useUserStore }   from '../store';

const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function UserFilters() {
  const { filters, setFilter, clearFilters } = useUserStore();
  const hasActive = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        placeholder="Search name, username, contact…"
        value={filters.search ?? ''}
        onChange={(e) => setFilter('search', e.target.value)}
        leftIcon={<Search size={14} />}
        wrapClass="w-64"
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
