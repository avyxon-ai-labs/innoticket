import { Plus } from 'lucide-react';
import { Button }     from '../components/ui/Button';
import { useServiceEscalationStore } from '../modules/configurations/service-escalations/store';
import { ServiceEscalationFilters }  from '../modules/configurations/service-escalations/components/ServiceEscalationFilters';
import { ServiceEscalationTable }    from '../modules/configurations/service-escalations/components/ServiceEscalationTable';
import { ServiceEscalationForm }     from '../modules/configurations/service-escalations/components/ServiceEscalationForm';

export function ServiceEscalationsPage() {
  const { openCreate } = useServiceEscalationStore();

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. Title card ───────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-4
                      flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">Service Escalations</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage service escalation types and SLA thresholds.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate} className="shrink-0">
          New Escalation
        </Button>
      </div>

      {/* ── 2. Filters card ─────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-3">
        <ServiceEscalationFilters />
      </div>

      {/* ── 3. Table card ───────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden flex flex-col">
        <ServiceEscalationTable flat />
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      <ServiceEscalationForm />
    </div>
  );
}
