import { Plus } from 'lucide-react';
import { Button }     from '../components/ui/Button';
import { useServiceEscalationStore } from '../modules/configurations/service-escalations/store';
import { ServiceEscalationFilters }  from '../modules/configurations/service-escalations/components/ServiceEscalationFilters';
import { ServiceEscalationTable }    from '../modules/configurations/service-escalations/components/ServiceEscalationTable';
import { ServiceEscalationForm }     from '../modules/configurations/service-escalations/components/ServiceEscalationForm';

export function ServiceEscalationsPage() {
  const { openCreate } = useServiceEscalationStore();

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">
            Service Escalations
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage service escalation types and SLA thresholds.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={openCreate}
        >
          New Escalation
        </Button>
      </div>

      {/* ── Card: filters + table ───────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-4 pb-2">
          <ServiceEscalationFilters />
        </div>
        <div className="px-4 pb-4 flex-1 min-h-0">
          <ServiceEscalationTable flat />
        </div>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      <ServiceEscalationForm />
    </div>
  );
}
