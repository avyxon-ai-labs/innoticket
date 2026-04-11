import { useRef }                from 'react';
import { Search, X }             from 'lucide-react';
import { Input }                 from '../../../components/ui/Input';
import { MultiSelect }           from '../../../components/ui/MultiSelect';
import { Button }                from '../../../components/ui/Button';
import { useTicketStore }        from '../store';
import {
  useActiveProjectCodes,
  useActiveServiceNames,
  useCenterCodesByProjects,
} from '../hooks';

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketFilters() {
  const {
    filters,
    setSearch, setProjectCodes, setCenterCodes, setServices, clearFilters,
  } = useTicketStore();

  const projectCodes = Array.isArray(filters.projectCodes) ? filters.projectCodes : [];
  const centerCodes  = Array.isArray(filters.centerCodes)  ? filters.centerCodes  : [];
  const services     = Array.isArray(filters.services)     ? filters.services     : [];

  const { data: allProjects = [], isLoading: loadingProjects } = useActiveProjectCodes();
  const { data: allServices = [], isLoading: loadingServices } = useActiveServiceNames();
  const { data: allCenters  = [], isLoading: loadingCenters  } =
    useCenterCodesByProjects(projectCodes);

  const hasActive =
    !!filters.search ||
    projectCodes.length > 0 ||
    centerCodes.length  > 0 ||
    services.length     > 0;

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearch(v: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 320);
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-3">
      {/* Search */}
      <Input
        placeholder="Search tickets…"
        defaultValue={filters.search}
        onChange={(e) => handleSearch(e.target.value)}
        leftIcon={<Search size={13} />}
        wrapClass="w-full sm:w-56"
      />

      {/* Project codes */}
      <MultiSelect
        placeholder="All projects"
        options={allProjects}
        value={projectCodes}
        onChange={setProjectCodes}
        loading={loadingProjects}
        wrapClass="w-full sm:w-44"
      />

      {/* Center codes — disabled until a project is selected */}
      <MultiSelect
        placeholder={projectCodes.length === 0 ? 'Select project first' : 'All centers'}
        options={allCenters}
        value={centerCodes}
        onChange={setCenterCodes}
        loading={loadingCenters}
        disabled={projectCodes.length === 0}
        wrapClass="w-full sm:w-44"
      />

      {/* Services */}
      <MultiSelect
        placeholder="All services"
        options={allServices}
        value={services}
        onChange={setServices}
        loading={loadingServices}
        wrapClass="w-full sm:w-44"
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
