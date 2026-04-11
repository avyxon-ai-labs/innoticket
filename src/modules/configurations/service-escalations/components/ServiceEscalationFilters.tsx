import { Search, X } from 'lucide-react';
import { Input }     from '../../../../components/ui/Input';
import { Button }    from '../../../../components/ui/Button';
import { useServiceEscalationStore } from '../store';

export function ServiceEscalationFilters() {
  const { filters, setFilter, clearFilters } = useServiceEscalationStore();
  const hasActive = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Search */}
      <Input
        placeholder="Search services…"
        value={filters.search ?? ''}
        onChange={(e) => setFilter('search', e.target.value)}
        leftIcon={<Search size={14} />}
        wrapClass="w-56"
      />

      {/* Clear */}
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
