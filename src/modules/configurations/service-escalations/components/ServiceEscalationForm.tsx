import { useEffect, useState } from 'react';
import { Modal }   from '../../../../components/ui/Modal';
import { Input }   from '../../../../components/ui/Input';
import { Button }  from '../../../../components/ui/Button';
import {
  useCreateServiceEscalation,
  useUpdateServiceEscalation,
} from '../hooks';
import { useServiceEscalationStore } from '../store';
import type { ServiceEscalationPayload } from '../../../../services/service-escalation.service';

// ── Defaults ──────────────────────────────────────────────────────────────────

const empty: ServiceEscalationPayload = {
  serviceName:      '',
  escalationType:   '',
  active:           true,
  slaLevel1Minutes: 0,
  slaLevel2Minutes: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a form string value to a non-negative integer, defaulting to 0. */
function toMinutes(raw: string): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceEscalationForm() {
  const { modalOpen, modalMode, editTarget, closeModal } = useServiceEscalationStore();

  const [form,   setForm]   = useState<ServiceEscalationPayload>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceEscalationPayload, string>>>({});

  const createMut = useCreateServiceEscalation();
  const updateMut = useUpdateServiceEscalation();
  const isPending = createMut.isPending || updateMut.isPending;

  // Populate on edit
  useEffect(() => {
    if (modalMode === 'edit' && editTarget) {
      setForm({
        serviceName:      editTarget.serviceName,
        escalationType:   editTarget.escalationType,
        active:           editTarget.active,
        slaLevel1Minutes: editTarget.slaLevel1Minutes,
        slaLevel2Minutes: editTarget.slaLevel2Minutes,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [modalOpen, modalMode, editTarget]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function patch<K extends keyof ServiceEscalationPayload>(
    key: K,
    val: ServiceEscalationPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.serviceName.trim())
      e.serviceName = 'Service name is required';
    if (!form.escalationType.trim())
      e.escalationType = 'Escalation type is required';
    if (form.slaLevel1Minutes <= 0)
      e.slaLevel1Minutes = 'Must be greater than 0';
    if (form.slaLevel2Minutes <= 0)
      e.slaLevel2Minutes = 'Must be greater than 0';
    if (form.slaLevel2Minutes > 0 && form.slaLevel2Minutes <= form.slaLevel1Minutes)
      e.slaLevel2Minutes = 'L2 threshold must be greater than L1';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (modalMode === 'create') {
        await createMut.mutateAsync(form);
      } else {
        await updateMut.mutateAsync({ id: editTarget!.id, payload: form });
      }
      closeModal();
    } catch {
      // Global error toast handled by Axios interceptor
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={modalOpen}
      onClose={closeModal}
      title={modalMode === 'create' ? 'New Escalation Config' : 'Edit Escalation Config'}
      description="Define the service, escalation type, and SLA thresholds in minutes."
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

        {/* Service Name */}
        <Input
          label="Service Name"
          placeholder="e.g. Network Outage"
          value={form.serviceName}
          onChange={(e) => patch('serviceName', e.target.value)}
          error={errors.serviceName}
        />

        {/* Escalation Type */}
        <Input
          label="Escalation Type"
          placeholder="e.g. EMAIL, SMS, CALL"
          value={form.escalationType}
          onChange={(e) => patch('escalationType', e.target.value)}
          error={errors.escalationType}
        />

        {/* SLA thresholds — side-by-side */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="SLA Level 1 (minutes)"
            placeholder="e.g. 60"
            type="number"
            min={1}
            value={form.slaLevel1Minutes === 0 ? '' : String(form.slaLevel1Minutes)}
            onChange={(e) => patch('slaLevel1Minutes', toMinutes(e.target.value))}
            error={errors.slaLevel1Minutes}
          />
          <Input
            label="SLA Level 2 (minutes)"
            placeholder="e.g. 120"
            type="number"
            min={1}
            value={form.slaLevel2Minutes === 0 ? '' : String(form.slaLevel2Minutes)}
            onChange={(e) => patch('slaLevel2Minutes', toMinutes(e.target.value))}
            error={errors.slaLevel2Minutes}
          />
        </div>

        {/* SLA hint */}
        <p className="text-[0.68rem] text-[var(--ink-light)] -mt-2">
          L1 fires first; L2 must exceed L1. Both values are in minutes.
        </p>

        {/* Active Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)]
                        bg-[var(--ghost)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">Active</p>
            <p className="text-xs text-[var(--ink-light)]">
              Inactive configs will not trigger escalations
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.active}
            onClick={() => patch('active', !form.active)}
            className={[
              'relative w-10 h-[22px] rounded-full transition-colors duration-200 outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
              form.active ? 'bg-[var(--sage)]' : 'bg-[var(--border)]',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow',
                'transition-transform duration-200',
                form.active ? 'translate-x-[18px]' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>

      </form>
    </Modal>
  );
}
