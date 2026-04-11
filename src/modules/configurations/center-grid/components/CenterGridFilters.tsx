import { Search, X }                            from 'lucide-react';
import { Input }                                from '../../../../components/ui/Input';
import { Button }                               from '../../../../components/ui/Button';
import { MultiSelect }                          from '../../../../components/ui/MultiSelect';
import {
  useActiveProjectCodes,
  useActiveServiceNames,
  useCenterCodesByProjects,
}                                               from '../hooks';
import { useCenterGridStore }                   from '../store';

export function CenterGridFilters() {
  const {
    filters: rawFilters,
    setSearch, setProjectCodes, setCenterCodes, setServiceNames,
    clearFilters,
  } = useCenterGridStore();

  // Guard against stale persisted data (old store had strings, not arrays)
  const filters = {
    search:       rawFilters.search       ?? '',
    projectCodes: Array.isArray(rawFilters.projectCodes) ? rawFilters.projectCodes : [],
    centerCodes:  Array.isArray(rawFilters.centerCodes)  ? rawFilters.centerCodes  : [],
    serviceNames: Array.isArray(rawFilters.serviceNames) ? rawFilters.serviceNames : [],
  };

  const { data: projectOptions = [], isLoading: loadingProjects } = useActiveProjectCodes();
  const { data: serviceOptions = [], isLoading: loadingServices } = useActiveServiceNames();

  // Center codes depend on selected projects — disabled until at least one project chosen
  const { data: centerCodeOptions = [], isLoading: loadingCenters } =
    useCenterCodesByProjects(filters.projectCodes);

  const hasActive =
    !!filters.search ||
    filters.projectCodes.length > 0 ||
    filters.centerCodes.length  > 0 ||
    filters.serviceNames.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: search + clear */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search project, centre, city, CSUP, service…"
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
          wrapClass="flex-1 min-w-[200px]"
        />
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            leftIcon={<X size={13} />}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Row 2: multi-select dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Project Codes */}
        <MultiSelect
          label="Project Code"
          placeholder="All projects"
          options={projectOptions}
          value={filters.projectCodes}
          onChange={setProjectCodes}
          loading={loadingProjects}
        />

        {/* Center Codes — disabled until project selected */}
        <div className="flex flex-col gap-1">
          <MultiSelect
            label="Centre Code"
            placeholder={
              filters.projectCodes.length === 0
                ? 'Select a project first'
                : 'All centres'
            }
            options={centerCodeOptions}
            value={filters.centerCodes}
            onChange={setCenterCodes}
            loading={loadingCenters}
            disabled={filters.projectCodes.length === 0}
          />
          {filters.projectCodes.length === 0 && (
            <p className="text-[0.65rem] text-[var(--ink-light)] pl-0.5">
              Select a project to enable centre filter
            </p>
          )}
        </div>

        {/* Service Names */}
        <MultiSelect
          label="Service Name"
          placeholder="All services"
          options={serviceOptions}
          value={filters.serviceNames}
          onChange={setServiceNames}
          loading={loadingServices}
        />
      </div>
    </div>
  );
}
