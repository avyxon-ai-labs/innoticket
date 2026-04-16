import { useRef, useEffect, useMemo } from 'react';
import { Search, X }                  from 'lucide-react';
import { Input }                      from '../../../components/ui/Input';
import { Select }                     from '../../../components/ui/Select';
import { MultiSelect }                from '../../../components/ui/MultiSelect';
import { Button }                     from '../../../components/ui/Button';
import { useTicketStore }             from '../store';
import {
  useActiveProjectCodes,
  useProjectServiceGroups,
  useCenterCodesByProjects,
  useCenterDetailsByProject,
} from '../hooks';

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketFilters() {
  const {
    filters,
    setSearch, setProjectCode, setCenterCodes, setServices,
    setStates, setCities, clearFilters,
  } = useTicketStore();

  const projectCode = typeof filters.projectCode === 'string' ? filters.projectCode : '';
  const centerCodes = Array.isArray(filters.centerCodes) ? filters.centerCodes : [];
  const services    = Array.isArray(filters.services)    ? filters.services    : [];
  const states      = Array.isArray(filters.states)      ? filters.states      : [];
  const cities      = Array.isArray(filters.cities)      ? filters.cities      : [];

  const { data: allProjects   = [], isLoading: loadingProjects } = useActiveProjectCodes();
  const { data: svcGroups     = [], isLoading: loadingServices  } =
    useProjectServiceGroups(projectCode || undefined);
  const { data: allCenters    = [], isLoading: loadingCenters   } =
    useCenterCodesByProjects(projectCode ? [projectCode] : []);
  const { data: centerDetails = [] } =
    useCenterDetailsByProject(projectCode || undefined);

  const allServices = svcGroups.map((g) => g.serviceName);

  // Derive unique states from center details
  const stateOptions = useMemo(
    () => [...new Set(centerDetails.map((c) => c.state).filter(Boolean))].sort(),
    [centerDetails],
  );

  // Derive cities — filtered by selected states when states are chosen
  const cityOptions = useMemo(() => {
    const base = states.length > 0
      ? centerDetails.filter((c) => states.includes(c.state))
      : centerDetails;
    return [...new Set(base.map((c) => c.city).filter(Boolean))].sort();
  }, [centerDetails, states]);

  // Auto-select first project when list loads and nothing is selected
  useEffect(() => {
    if (!projectCode && allProjects.length > 0) {
      setProjectCode(allProjects[0]);
    }
  }, [allProjects, projectCode, setProjectCode]);

  const hasActive =
    !!filters.search   ||
    centerCodes.length > 0 ||
    services.length    > 0 ||
    states.length      > 0 ||
    cities.length      > 0;

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

      {/* Project */}
      <Select
        placeholder={loadingProjects ? 'Loading…' : 'Select project…'}
        value={projectCode}
        onChange={setProjectCode}
        options={projectOptions}
        wrapClass="w-full sm:w-[22rem]"
      />

      {/* Center codes */}
      <MultiSelect
        placeholder={!projectCode ? 'Select project first' : 'All centers'}
        options={allCenters}
        value={centerCodes}
        onChange={setCenterCodes}
        loading={loadingCenters}
        disabled={!projectCode}
        searchable
        wrapClass="w-full sm:w-[22rem]"
      />

      {/* State */}
      <MultiSelect
        placeholder={!projectCode ? 'Select project first' : 'All states'}
        options={stateOptions}
        value={states}
        onChange={setStates}
        disabled={!projectCode || stateOptions.length === 0}
        searchable
        wrapClass="w-full sm:w-44"
      />

      {/* City — options filtered by selected states */}
      <MultiSelect
        placeholder={!projectCode ? 'Select project first' : 'All cities'}
        options={cityOptions}
        value={cities}
        onChange={setCities}
        disabled={!projectCode || cityOptions.length === 0}
        searchable
        wrapClass="w-full sm:w-44"
      />

      {/* Services */}
      <MultiSelect
        placeholder={!projectCode ? 'Select project first' : 'All services'}
        options={allServices}
        value={services}
        onChange={setServices}
        loading={loadingServices}
        disabled={!projectCode}
        wrapClass="w-full sm:w-44"
      />

      {/* Clear — keeps project, resets everything else */}
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
