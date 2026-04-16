import { useEffect, useMemo }   from 'react';
import { X }                     from 'lucide-react';
import { Select }                from '../../../components/ui/Select';
import { MultiSelect }           from '../../../components/ui/MultiSelect';
import { Button }                from '../../../components/ui/Button';
import { useDashboardStore }     from '../store';
import { useAuthStore }          from '../../../store/authStore';
import {
  useActiveProjectCodes,
  useCenterCodesByProjects,
  useProjectServiceGroups,
  useCenterDetailsByProject,
} from '../hooks';

export function DashboardFilters() {
  const {
    filters,
    setProjectCode, setServices, setEscalationTypes, setCentreCodes,
    setStates, setCities, clearFilters,
  } = useDashboardStore();

  const projectCode     = typeof filters.projectCode === 'string'         ? filters.projectCode     : '';
  const services        = Array.isArray(filters.services)                 ? filters.services        : [];
  const escalationTypes = Array.isArray(filters.escalationTypes)          ? filters.escalationTypes : [];
  const centreCodes     = Array.isArray(filters.centreCodes)              ? filters.centreCodes     : [];
  const states          = Array.isArray(filters.states)                   ? filters.states          : [];
  const cities          = Array.isArray(filters.cities)                   ? filters.cities          : [];

  const user          = useAuthStore((s) => s.user);
  const isClient      = user?.role?.toUpperCase() === 'CLIENT';
  const clientProject = user?.projectCode ?? '';

  const { data: allProjects   = [], isLoading: loadingProjects } = useActiveProjectCodes();
  const { data: svcGroups     = [], isLoading: loadingSvc       } =
    useProjectServiceGroups(projectCode || undefined);
  const { data: allCentres    = [], isLoading: loadingCentres   } =
    useCenterCodesByProjects(projectCode ? [projectCode] : []);
  const { data: centerDetails = [] } =
    useCenterDetailsByProject(projectCode || undefined);

  // CLIENT: lock to their assigned project as soon as it is known
  useEffect(() => {
    if (isClient && clientProject && projectCode !== clientProject) {
      setProjectCode(clientProject);
    }
  }, [isClient, clientProject, projectCode, setProjectCode]);

  // Non-CLIENT: auto-select first project when none is chosen
  useEffect(() => {
    if (!isClient && !projectCode && allProjects.length > 0) {
      setProjectCode(allProjects[0]);
    }
  }, [isClient, allProjects, projectCode, setProjectCode]);

  const serviceOptions    = svcGroups.map((g) => g.serviceName);
  const availableTypes    = services.length > 0
    ? svcGroups.filter((g) => services.includes(g.serviceName)).flatMap((g) => g.escalationTypes)
    : svcGroups.flatMap((g) => g.escalationTypes);
  const escalationOptions = [...new Set(availableTypes)].sort();

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

  const hasActive =
    services.length    > 0 ||
    escalationTypes.length > 0 ||
    centreCodes.length > 0 ||
    states.length      > 0 ||
    cities.length      > 0;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Project — locked badge for CLIENT, dropdown for others */}
      {isClient ? (
        <div className="flex items-center h-9 px-3 rounded-lg border border-[var(--border)]
                        bg-[var(--ghost)] text-sm text-[var(--ink)] w-full sm:w-48 select-none">
          {clientProject || '—'}
        </div>
      ) : (
        <Select
          placeholder={loadingProjects ? 'Loading…' : 'Select project…'}
          value={projectCode}
          onChange={setProjectCode}
          options={allProjects.map((p) => ({ value: p, label: p }))}
          wrapClass="w-full sm:w-[22rem]"
        />
      )}

      {/* Services */}
      <MultiSelect
        placeholder={!projectCode ? 'Select project first' : 'All services'}
        options={serviceOptions}
        value={services}
        onChange={setServices}
        loading={loadingSvc}
        disabled={!projectCode}
        wrapClass="w-full sm:w-44"
      />

      {/* Escalation types */}
      <MultiSelect
        placeholder="All escalation types"
        options={escalationOptions}
        value={escalationTypes}
        onChange={setEscalationTypes}
        disabled={escalationOptions.length === 0}
        wrapClass="w-full sm:w-48"
      />

      {/* Centre codes */}
      <MultiSelect
        placeholder={!projectCode ? 'Select project first' : 'All centres'}
        options={allCentres}
        value={centreCodes}
        onChange={setCentreCodes}
        loading={loadingCentres}
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

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<X size={13} />}
          onClick={() => clearFilters(projectCode)}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
