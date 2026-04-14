import { Plus }                  from 'lucide-react';
import { Button }                from '../components/ui/Button';
import { useProjectStore }       from '../modules/configurations/projects/store';
import { ProjectFilters }        from '../modules/configurations/projects/components/ProjectFilters';
import { ProjectTable }          from '../modules/configurations/projects/components/ProjectTable';
import { ProjectForm }           from '../modules/configurations/projects/components/ProjectForm';
import { ProjectDeleteDialog }   from '../modules/configurations/projects/components/ProjectDeleteDialog';

export function ProjectsPage() {
  const { openCreate } = useProjectStore();

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">
            Projects
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage projects, SLA thresholds and access credentials.
          </p>
        </div>

        <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          New Project
        </Button>
      </div>

      {/* ── Card: filters + table ───────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-4 pb-2">
          <ProjectFilters />
        </div>
        <div className="px-4 pb-4 flex-1 min-h-0">
          <ProjectTable flat />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <ProjectForm />
      <ProjectDeleteDialog />
    </div>
  );
}
