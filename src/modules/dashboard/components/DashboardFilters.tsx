import { useEffect }          from 'react';
import { X }                  from 'lucide-react';
import { Select }             from '../../../components/ui/Select';
import { MultiSelect }        from '../../../components/ui/MultiSelect';
import { Button }             from '../../../components/ui/Button';
import { useDashboardStore }  from '../store';
import { useAuthStore }       from '../../../store/authStore';
import {
  useActiveProjectCodes,
  useCenterCodesByProjects,
  useServiceEscalationGroups,
} from '../hooks';

export function DashboardFilters() {
  const {
    filters,
    setProjectCode, setServices, setEscalationTypes, setCentreCodes, clearFilters,
  } = useDashboardStore();

  const { projectCode, services, escalationTypes, centreCodes } = filters;

  const user      = useAuthStore((s) => s.user);
  const isClient  = user?.role?.toUpperCase() === 'CLIENT';
  const clientProject = user?.projectCode ?? '';

  const { data: allProjects = [], isLoading: loadingProjects } = useActiveProjectCodes();
  const { data: svcGroups  = [], isLoading: loadingSvc       } = useServiceEscalationGroups();
  const { data: allCentres = [], isLoading: loadingCentres   } =
    useCenterCodesByProjects(projectCode ? [projectCode] : []);

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

  const hasActive = services.length > 0 || escalationTypes.length > 0 || centreCodes.length > 0;

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
          wrapClass="w-full sm:w-[26rem]"
        />
      )}

      {/* Services */}
      <MultiSelect
        placeholder="All services"
        options={serviceOptions}
        value={services}
        onChange={setServices}
        loading={loadingSvc}
        wrapClass="w-full sm:w-44"
      />

      {/* Escalation types — filtered by selected services */}
      <MultiSelect
        placeholder="All escalation types"
        options={escalationOptions}
        value={escalationTypes}
        onChange={setEscalationTypes}
        disabled={escalationOptions.length === 0}
        wrapClass="w-full sm:w-48"
      />

      {/* Centre codes — depends on project */}
      <MultiSelect
        placeholder={!projectCode ? 'Select project first' : 'All centres'}
        options={allCentres}
        value={centreCodes}
        onChange={setCentreCodes}
        loading={loadingCentres}
        disabled={!projectCode}
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
