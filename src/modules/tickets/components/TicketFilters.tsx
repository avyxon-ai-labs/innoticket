import { useRef, useEffect }  from 'react';
import { Search, X }          from 'lucide-react';
import { Input }              from '../../../components/ui/Input';
import { Select }             from '../../../components/ui/Select';
import { MultiSelect }        from '../../../components/ui/MultiSelect';
import { Button }             from '../../../components/ui/Button';
import { useTicketStore }     from '../store';
import {
  useActiveProjectCodes,
  useActiveServiceNames,
  useCenterCodesByProjects,
} from '../hooks';

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketFilters() {
  const {
    filters,
    setSearch, setProjectCode, setCenterCodes, setServices, clearFilters,
  } = useTicketStore();

  const projectCode = typeof filters.projectCode === 'string' ? filters.projectCode : '';
  const centerCodes = Array.isArray(filters.centerCodes) ? filters.centerCodes : [];
  const services    = Array.isArray(filters.services)    ? filters.services    : [];

  const { data: allProjects = [], isLoading: loadingProjects } = useActiveProjectCodes();
  const { data: allServices = [], isLoading: loadingServices } = useActiveServiceNames();
  const { data: allCenters  = [], isLoading: loadingCenters  } =
    useCenterCodesByProjects(projectCode ? [projectCode] : []);

  // Auto-select first project when list loads and nothing is selected
  useEffect(() => {
    if (!projectCode && allProjects.length > 0) {
      setProjectCode(allProjects[0]);
    }
  }, [allProjects, projectCode, setProjectCode]);

  const hasActive =
    !!filters.search ||
    centerCodes.length > 0 ||
    services.length    > 0;

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearch(v: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 320);
  }

  const projectOptions = allProjects.map((p) => ({ value: p, label: p }));

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

      {/* Project — single mandatory select, always has a value */}
      <Select
        placeholder={loadingProjects ? 'Loading…' : 'Select project…'}
        value={projectCode}
        onChange={setProjectCode}
        options={projectOptions}
        wrapClass="w-full sm:w-48"
      />

      {/* Center codes — disabled until project is selected */}
      <MultiSelect
        placeholder={!projectCode ? 'Select project first' : 'All centers'}
        options={allCenters}
        value={centerCodes}
        onChange={setCenterCodes}
        loading={loadingCenters}
        disabled={!projectCode}
        searchable
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

      {/* Clear — only clears non-project filters, keeps project */}
      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearFilters(projectCode)}
          leftIcon={<X size={13} />}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
