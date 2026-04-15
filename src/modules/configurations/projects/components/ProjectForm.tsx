import { useEffect, useState }                    from 'react';
import { Check, ChevronDown, Loader2, RotateCcw } from 'lucide-react';
import { Modal }                                   from '../../../../components/ui/Modal';
import { Input }                                   from '../../../../components/ui/Input';
import { Select }                                  from '../../../../components/ui/Select';
import { Button }                                  from '../../../../components/ui/Button';
import { PasswordInput }                           from '../../../auth/components/PasswordInput';
import { useCreateProject, useUpdateProject,
         useGroupedActiveEscalations }             from '../hooks';
import type { EscalationGroup }                    from '../hooks';
import { useProjectStore }                         from '../store';
import type { ProjectPayload,
              ProjectService }                     from '../../../../services/project.service';
import { cn }                                      from '../../../../utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'INACTIVE', label: 'Inactive' },
];

const EMPTY: ProjectPayload = {
  projectName:  '',
  projectCode:  '',
  username:     '',
  password:     '',
  status:       'ACTIVE',
  examEndDate:  '',
  services:     [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMin(raw: string): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ── Sub-component: SLA mini-input ─────────────────────────────────────────────

function SlaInput({
  label, value, defaultValue, onChange,
}: {
  label:        string;
  value:        number;
  /** Default from the service-escalation config; drives the reset button. */
  defaultValue: number;
  onChange:     (v: number) => void;
}) {
  const isEmpty  = value <= 0;
  const isDirty  = !isEmpty && defaultValue > 0 && value !== defaultValue;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Label row */}
      <div className="flex items-center justify-between gap-1">
        <span className={cn(
          'text-[0.56rem] font-semibold uppercase tracking-wider',
          isEmpty ? 'text-[#EF4444]' : 'text-[var(--ink-light)]',
        )}>
          {label}{isEmpty && ' *'}
        </span>
        {isDirty && (
          <button
            type="button"
            title={`Reset to config default (${defaultValue} min)`}
            onClick={() => onChange(defaultValue)}
            className="flex items-center gap-0.5 text-[0.55rem] text-[#7C3AED]
                       hover:text-[#5B21B6] transition-colors leading-none"
          >
            <RotateCcw size={8} />
            <span>{defaultValue}m</span>
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="number"
          min={1}
          value={value > 0 ? value : ''}
          onChange={(e) => onChange(toMin(e.target.value))}
          placeholder={defaultValue > 0 ? `${defaultValue}` : 'Required'}
          className={cn(
            'w-full h-7 pl-2 pr-6 text-xs rounded-[6px] tabular-nums transition-colors duration-150',
            'border bg-[var(--surface)] text-[var(--ink)]',
            'focus:outline-none focus:ring-1',
            isEmpty
              ? 'border-[#FCA5A5] bg-[#FEF2F2] focus:ring-[#EF4444]/40 placeholder:text-[#FCA5A5]'
              : isDirty
                ? 'border-[#7C3AED]/50 bg-[#F5F3FF] focus:ring-[var(--sage)]'
                : 'border-[var(--border)] focus:ring-[var(--sage)]',
          )}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2
                         text-[0.55rem] text-[var(--ink-light)] pointer-events-none">
          min
        </span>
      </div>
    </div>
  );
}

// ── Sub-component: Service Snapshot Picker ────────────────────────────────────

function ServicePicker({
  groups,
  isLoading,
  services,
  onChange,
}: {
  groups:    EscalationGroup[];
  isLoading: boolean;
  services:  ProjectService[];
  onChange:  (services: ProjectService[]) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set<string>());

  // When services are auto-assigned (or loaded from editTarget), expand all
  // selected service groups so the user sees their SLA values immediately.
  useEffect(() => {
    if (services.length > 0) {
      setExpanded(new Set(services.map((s) => s.serviceName)));
    }
  }, [services.length]);

  function isEscSelected(sn: string, et: string) {
    return services.some((s) => s.serviceName === sn && s.escalationType === et);
  }

  function isServiceSelected(sn: string) {
    return services.some((s) => s.serviceName === sn);
  }

  function toggleExpand(sn: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(sn) ? next.delete(sn) : next.add(sn);
      return next;
    });
  }

  function toggleService(group: EscalationGroup) {
    if (isServiceSelected(group.serviceName)) {
      // deselect all + collapse
      onChange(services.filter((s) => s.serviceName !== group.serviceName));
      setExpanded((prev) => { const n = new Set(prev); n.delete(group.serviceName); return n; });
    } else {
      // select all with defaults + expand
      onChange([
        ...services,
        ...group.escalations.map((e) => ({
          serviceName:      group.serviceName,
          escalationType:   e.escalationType,
          slaLevel1Minutes: e.slaLevel1Minutes,
          slaLevel2Minutes: e.slaLevel2Minutes,
        })),
      ]);
      setExpanded((prev) => new Set([...prev, group.serviceName]));
    }
  }

  function toggleEsc(sn: string, esc: EscalationGroup['escalations'][0]) {
    if (isEscSelected(sn, esc.escalationType)) {
      onChange(services.filter((s) => !(s.serviceName === sn && s.escalationType === esc.escalationType)));
    } else {
      onChange([
        ...services,
        { serviceName: sn, escalationType: esc.escalationType,
          slaLevel1Minutes: esc.slaLevel1Minutes, slaLevel2Minutes: esc.slaLevel2Minutes },
      ]);
    }
  }

  function updateSla(
    sn: string, et: string,
    field: 'slaLevel1Minutes' | 'slaLevel2Minutes',
    val: number,
  ) {
    onChange(services.map((s) =>
      s.serviceName === sn && s.escalationType === et ? { ...s, [field]: val } : s,
    ));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-[var(--ink-light)]">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-xs">Loading services…</span>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="text-center text-xs text-[var(--ink-light)] py-5">
        No active service escalation configs found.
      </p>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-[10px] overflow-hidden
                    divide-y divide-[var(--border)]">
      {groups.map((group) => {
        const anySelected  = isServiceSelected(group.serviceName);
        const isExpanded   = expanded.has(group.serviceName);
        const selectedCount = services.filter((s) => s.serviceName === group.serviceName).length;

        return (
          <div key={group.serviceName}>

            {/* ── Service header row ── */}
            <div
              role="button"
              onClick={() => toggleExpand(group.serviceName)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors',
                anySelected ? 'bg-[#EFF6FF]' : 'hover:bg-[var(--ghost)]',
              )}
            >
              {/* Service-level checkbox */}
              <button
                type="button"
                aria-label={`Toggle ${group.serviceName}`}
                onClick={(e) => { e.stopPropagation(); toggleService(group); }}
                className={cn(
                  'w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors',
                  anySelected
                    ? 'bg-[#3B82F6] border-[#3B82F6]'
                    : 'border-[var(--border)] hover:border-[#3B82F6] bg-[var(--surface)]',
                )}
              >
                {anySelected && <Check size={9} strokeWidth={3} className="text-white" />}
              </button>

              <span className="text-sm font-medium text-[var(--ink)] flex-1 leading-none">
                {group.serviceName}
              </span>

              {anySelected && (
                <span className="text-[0.58rem] font-semibold text-[#3B82F6]
                                 bg-[#DBEAFE] px-1.5 py-0.5 rounded-full leading-none shrink-0">
                  {selectedCount}/{group.escalations.length}
                </span>
              )}

              <ChevronDown
                size={13}
                className={cn(
                  'text-[var(--ink-light)] transition-transform duration-200 shrink-0',
                  isExpanded && 'rotate-180',
                )}
              />
            </div>

            {/* ── Escalation type rows (expanded) ── */}
            {isExpanded && (
              <div className="bg-[var(--ghost)] divide-y divide-[var(--border)]">
                {group.escalations.map((esc) => {
                  const selected = isEscSelected(group.serviceName, esc.escalationType);
                  const entry    = services.find(
                    (s) => s.serviceName === group.serviceName && s.escalationType === esc.escalationType,
                  );

                  return (
                    <div key={esc.escalationType} className="px-3 py-2.5">

                      {/* Escalation type toggle row */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Toggle ${esc.escalationType}`}
                          onClick={() => toggleEsc(group.serviceName, esc)}
                          className={cn(
                            'w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors',
                            selected
                              ? 'bg-[#7C3AED] border-[#7C3AED]'
                              : 'border-[var(--border)] hover:border-[#7C3AED] bg-[var(--surface)]',
                          )}
                        >
                          {selected && <Check size={8} strokeWidth={3} className="text-white" />}
                        </button>

                        <span className="text-[0.72rem] font-mono font-semibold text-[var(--ink)] tracking-wide">
                          {esc.escalationType}
                        </span>

                        {/* Show config defaults when not selected */}
                        {!selected && (
                          esc.slaLevel1Minutes > 0 && esc.slaLevel2Minutes > 0 ? (
                            <span className="ml-auto text-[0.58rem] text-[var(--ink-light)] tabular-nums">
                              default: L1 {esc.slaLevel1Minutes}m · L2 {esc.slaLevel2Minutes}m
                            </span>
                          ) : (
                            <span className="ml-auto text-[0.58rem] text-[#F97316] font-medium">
                              SLA not set in config
                            </span>
                          )
                        )}
                      </div>

                      {/* Editable SLA inputs when selected */}
                      {selected && entry && (
                        <div className="mt-2 ml-[1.375rem] grid grid-cols-2 gap-2">
                          <SlaInput
                            label="SLA L1"
                            value={entry.slaLevel1Minutes}
                            defaultValue={esc.slaLevel1Minutes}
                            onChange={(v) => updateSla(group.serviceName, esc.escalationType, 'slaLevel1Minutes', v)}
                          />
                          <SlaInput
                            label="SLA L2"
                            value={entry.slaLevel2Minutes}
                            defaultValue={esc.slaLevel2Minutes}
                            onChange={(v) => updateSla(group.serviceName, esc.escalationType, 'slaLevel2Minutes', v)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function ProjectForm() {
  const { modalOpen, modalMode, editTarget, closeModal } = useProjectStore();

  const [form,   setForm]   = useState<ProjectPayload>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<ProjectPayload, 'services'>, string>>>({});

  const createMut  = useCreateProject();
  const updateMut  = useUpdateProject();
  const isPending  = createMut.isPending || updateMut.isPending;

  // Fetch fresh active escalation configs whenever the modal is open
  const { data: groups = [], isLoading: groupsLoading } = useGroupedActiveEscalations(modalOpen);

  // ── Populate on open ───────────────────────────────────────────────────────

  useEffect(() => {
    if (modalMode === 'edit' && editTarget) {
      setForm({
        projectName:  editTarget.projectName,
        projectCode:  editTarget.projectCode,
        username:     editTarget.username,
        password:     editTarget.password,
        status:       editTarget.status,
        examEndDate:  editTarget.examEndDate ?? '',
        services:     editTarget.services ?? [],
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [modalOpen, modalMode, editTarget]);

  // ── Auto-select all active escalations on create ───────────────────────────
  // Fires once when groups data arrives (query resolves after modal opens).
  // Skipped for edit mode (project already has its own snapshot).

  useEffect(() => {
    if (modalMode !== 'create' || groups.length === 0) return;

    const allServices = groups.flatMap((g) =>
      g.escalations.map((e) => ({
        serviceName:      g.serviceName,
        escalationType:   e.escalationType,
        slaLevel1Minutes: e.slaLevel1Minutes,
        slaLevel2Minutes: e.slaLevel2Minutes,
      })),
    );

    setForm((prev) => ({
      ...prev,
      // Only auto-assign if the user hasn't manually changed the list yet
      services: prev.services.length === 0 ? allServices : prev.services,
    }));
  }, [groups, modalMode]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function patch<K extends keyof Omit<ProjectPayload, 'services'>>(
    key: K,
    val: Omit<ProjectPayload, 'services'>[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.projectName.trim()) e.projectName = 'Project name is required';
    if (!form.projectCode.trim()) e.projectCode = 'Project code is required';
    if (!form.username.trim())    e.username    = 'Username is required';
    if (!form.password.trim())    e.password    = 'Password is required';

    // Every selected escalation must have valid SLA values
    const missingSla = form.services.some(
      (s) => s.slaLevel1Minutes <= 0 || s.slaLevel2Minutes <= 0,
    );
    if (missingSla) {
      // Surface the error under the services section via the projectName error slot
      // but use a dedicated key so it doesn't collide with real field errors
      (e as Record<string, string>).services =
        'All selected escalations must have SLA L1 and L2 values set (> 0 min).';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // Strip empty optional fields so they're omitted from the JSON body
    const payload: ProjectPayload = {
      ...form,
      examEndDate: form.examEndDate || undefined,
    };
    try {
      if (modalMode === 'create') {
        await createMut.mutateAsync(payload);
      } else {
        await updateMut.mutateAsync({ id: editTarget!.id, payload });
      }
      closeModal();
    } catch {
      // Global error toast handled by Axios interceptor
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={modalOpen}
      onClose={closeModal}
      title={modalMode === 'create' ? 'New Project' : 'Edit Project'}
      description="Configure project details, credentials, and service snapshots."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={closeModal} disabled={isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={isPending}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
          >
            {modalMode === 'create' ? 'Create' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Project Name + Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Project Name"
            placeholder="e.g. HQ Network"
            value={form.projectName}
            onChange={(e) => patch('projectName', e.target.value)}
            error={errors.projectName}
          />
          <Input
            label="Project Code"
            placeholder="e.g. HQ-NET-01"
            value={form.projectCode}
            onChange={(e) => patch('projectCode', e.target.value.toUpperCase())}
            error={errors.projectCode}
          />
        </div>

        {/* Username */}
        <Input
          label="Username"
          placeholder="System account identifier"
          value={form.username}
          onChange={(e) => patch('username', e.target.value)}
          error={errors.username}
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Project access password"
          value={form.password}
          onChange={(e) => patch('password', e.target.value)}
          error={errors.password}
        />

        {/* Exam End Date + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Exam End Date"
            type="date"
            value={form.examEndDate ?? ''}
            onChange={(e) => patch('examEndDate', e.target.value || undefined)}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(val) => patch('status', val as ProjectPayload['status'])}
          />
        </div>

        {/* ── Services snapshot ──────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--ink)]">
              Services
            </label>
            {form.services.length > 0 && (
              <span className="text-[0.62rem] font-medium text-[#3B82F6]
                               bg-[#EFF6FF] border border-[#BFDBFE]
                               rounded-full px-2 py-0.5 leading-none">
                {form.services.length} escalation{form.services.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          <p className="text-[0.68rem] text-[var(--ink-light)] -mt-0.5">
            Select services and customise SLA thresholds for this project.
            Values are snapshotted — changing global configs later won't affect this project.
          </p>

          {/* Services validation error */}
          {(errors as Record<string, string>).services && (
            <p className="text-[0.68rem] text-[#EF4444] font-medium">
              {(errors as Record<string, string>).services}
            </p>
          )}

          {/* Scrollable picker for long lists */}
          <div className="max-h-[260px] overflow-y-auto rounded-[10px]
                          [&::-webkit-scrollbar]:w-1.5
                          [&::-webkit-scrollbar-track]:rounded-full
                          [&::-webkit-scrollbar-track]:bg-transparent
                          [&::-webkit-scrollbar-thumb]:rounded-full
                          [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
            <ServicePicker
              groups={groups}
              isLoading={groupsLoading}
              services={form.services}
              onChange={(services) => setForm((prev) => ({ ...prev, services }))}
            />
          </div>
        </div>

      </form>
    </Modal>
  );
}
