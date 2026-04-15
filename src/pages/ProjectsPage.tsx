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
    <div className="flex flex-col gap-4">

      {/* ── 1. Title card ───────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-4
                      flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">Projects</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage projects, SLA thresholds and access credentials.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate} className="shrink-0">
          New Project
        </Button>
      </div>

      {/* ── 2. Filters card ─────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-3">
        <ProjectFilters />
      </div>

      {/* ── 3. Table card ───────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden flex flex-col">
        <ProjectTable flat />
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <ProjectForm />
      <ProjectDeleteDialog />
    </div>
  );
}
