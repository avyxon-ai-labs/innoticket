import { ArrowLeft, Pencil, MapPin, Phone, Users, Calendar } from 'lucide-react';
import { Button }             from '../../../../components/ui/Button';
import { Spinner }            from '../../../../components/ui/Spinner';
import { useNavigationStore } from '../../../../store/navigationStore';
import { useCenterGridStore } from '../store';
import { useCenterGridById }  from '../hooks';
import { formatLocalDateTime } from '../../../../utils';

// ── Field ──────────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--ink-light)]">
        {label}
      </span>
      <span className="text-sm text-[var(--ink)]">{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, icon, children }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-[var(--ink-light)]">{icon}</span>}
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-light)]">
          {title}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CenterGridDetail({ gridId }: { gridId: number }) {
  const { popView }  = useNavigationStore();
  const { openEdit } = useCenterGridStore();

  const { data: grid, isLoading, isError } = useCenterGridById(gridId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError || !grid) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-[var(--ink-mid)]">Failed to load centre details.</p>
        <Button variant="outline" size="sm" onClick={popView}>Go back</Button>
      </div>
    );
  }

  const serviceCount = Object.keys(grid.serviceMappings).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={popView}
          className="p-2 rounded-[10px] text-[var(--ink-light)] hover:bg-[var(--ghost)]
                     hover:text-[var(--ink)] transition-colors duration-150"
          aria-label="Back to centre grids"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--ink)] truncate">{grid.centerName}</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--ghost)]
                             border border-[var(--border)] text-[var(--ink-mid)]">
              {grid.centerCode}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--sage-light)]
                             text-[var(--sage)]">
              {grid.projectCode}
            </span>
          </div>
          <p className="text-sm text-[var(--ink-light)] mt-0.5">
            {grid.city}{grid.state ? `, ${grid.state}` : ''}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Pencil size={13} />}
          onClick={() => openEdit(grid)}
        >
          Edit
        </Button>
      </div>

      {/* Location & Identity */}
      <Section title="Centre Details" icon={<MapPin size={14} />}>
        <Field label="Project Code"  value={grid.projectCode} />
        <Field label="Center Code"   value={
          <span className="font-mono text-sm">{grid.centerCode}</span>
        } />
        <Field label="Center Name"   value={grid.centerName} />
        <Field label="State"         value={grid.state  || '—'} />
        <Field label="City"          value={grid.city   || '—'} />
        <Field label="Address"       value={grid.centerAddress || '—'} />
      </Section>

      {/* CSUP */}
      <Section title="CSUP Contact" icon={<Phone size={14} />}>
        <Field label="CSUP Name"   value={grid.csupName   || '—'} />
        <Field label="CSUP Number" value={grid.csupNumber || '—'} />
      </Section>

      {/* Exam */}
      <Section title="Examination" icon={<Calendar size={14} />}>
        <Field label="Total Candidates" value={
          <span className="font-mono text-sm">{grid.totalCandidate}</span>
        } />
        <Field label="Exam Dates" value={grid.examDates || '—'} />
      </Section>

      {/* Service Mappings */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={14} className="text-[var(--ink-light)]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-light)]">
            Service Mappings
            <span className="ml-2 font-mono normal-case text-[var(--sage)]">
              ({serviceCount})
            </span>
          </p>
        </div>

        {serviceCount === 0 ? (
          <p className="text-sm text-[var(--ink-light)]">No services mapped to this centre.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {Object.entries(grid.serviceMappings).map(([service, email]) => (
              <div key={service} className="flex items-center justify-between py-2.5 gap-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs
                                 font-semibold bg-[var(--sage-light)] text-[var(--sage)]
                                 font-mono tracking-wide shrink-0">
                  {service}
                </span>
                <span className="text-sm text-[var(--ink-mid)] truncate">{email}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit */}
      <Section title="Audit">
        <Field label="Created At" value={formatLocalDateTime(grid.createdAt)} />
        <Field label="Updated At" value={formatLocalDateTime(grid.updatedAt)} />
      </Section>
    </div>
  );
}
