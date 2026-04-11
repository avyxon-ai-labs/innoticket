import { useState }                      from 'react';
import { Modal }                         from '../../../components/ui/Modal';
import { Button }                        from '../../../components/ui/Button';
import { Select }                        from '../../../components/ui/Select';
import { AttachmentUploader }            from './AttachmentUploader';
import { useRaiseTicket,
         useActiveProjectCodes,
         useActiveServiceNames,
         useCenterCodesByProjects,
         useEscalationTypesByService }    from '../hooks';
import { useTicketStore }                from '../store';
import type { Attachment }               from '../../../services/ticket.service';

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-4">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={
            i < step
              ? 'w-5 h-1.5 rounded-full bg-[var(--sage)]'
              : i === step
                ? 'w-5 h-1.5 rounded-full bg-[var(--sage-mid)]'
                : 'w-2 h-1.5 rounded-full bg-[var(--border)]'
          }
        />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  projectCode:    '',
  centerCode:     '',
  serviceName:    '',
  escalationType: '',
  description:    '',
};

export function TicketForm() {
  const { createOpen, closeCreate } = useTicketStore();
  const raiseMut                    = useRaiseTicket();

  const [step,        setStep]        = useState(0); // 0 = details, 1 = description
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors,      setErrors]      = useState<Partial<typeof EMPTY_FORM>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Lookups
  const { data: projects        = [], isLoading: loadingProjects    } = useActiveProjectCodes();
  const { data: services        = [], isLoading: loadingServices    } = useActiveServiceNames();
  const { data: centers         = [], isLoading: loadingCenters     } =
    useCenterCodesByProjects(form.projectCode ? [form.projectCode] : []);
  const { data: escalationTypes = [], isLoading: loadingEscalations } =
    useEscalationTypesByService(form.serviceName || null);

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    if (field === 'projectCode') {
      // Changing project resets center and escalation type
      setForm((f) => ({ ...f, projectCode: value, centerCode: '', escalationType: '' }));
    } else if (field === 'serviceName') {
      // Changing service resets escalation type
      setForm((f) => ({ ...f, serviceName: value, escalationType: '' }));
    } else {
      setForm((f) => ({ ...f, [field]: value }));
    }
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  // ── Step 0 validation ─────────────────────────────────────────────────────

  function validateStep0(): boolean {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.projectCode)    e.projectCode    = 'Required';
    if (!form.centerCode)     e.centerCode     = 'Required';
    if (!form.serviceName)    e.serviceName    = 'Required';
    if (!form.escalationType.trim()) e.escalationType = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Step 1 validation ─────────────────────────────────────────────────────

  function validateStep1(): boolean {
    if (!form.description.trim()) {
      setErrors((e) => ({ ...e, description: 'Description is required' }));
      return false;
    }
    return true;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateStep1()) return;
    setSubmitError(null);
    try {
      await raiseMut.mutateAsync({
        projectCode:    form.projectCode,
        centerCode:     form.centerCode,
        serviceName:    form.serviceName,
        escalationType: form.escalationType.trim(),
        description:    form.description.trim(),
        attachments,
      });
      // Reset on success
      setForm(EMPTY_FORM);
      setAttachments([]);
      setErrors({});
      setSubmitError(null);
      setStep(0);
      closeCreate();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message
        ?? 'Something went wrong. Please try again.';
      setSubmitError(msg);
    }
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setAttachments([]);
    setErrors({});
    setSubmitError(null);
    setStep(0);
    closeCreate();
  }

  // ── Footer per step ───────────────────────────────────────────────────────

  const footer =
    step === 0 ? (
      <>
        <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
        <Button
          size="sm"
          onClick={() => { if (validateStep0()) setStep(1); }}
        >
          Next →
        </Button>
      </>
    ) : (
      <>
        <Button variant="outline" size="sm" onClick={() => setStep(0)}>← Back</Button>
        <Button
          size="sm"
          loading={raiseMut.isPending}
          onClick={handleSubmit}
        >
          Raise Ticket
        </Button>
      </>
    );

  return (
    <Modal
      open={createOpen}
      onClose={handleClose}
      title="Raise a Ticket"
      description={step === 0 ? 'Step 1 of 2 — Ticket details' : 'Step 2 of 2 — Description & attachments'}
      size="md"
      footer={footer}
    >
      <StepDots step={step} total={2} />

      {step === 0 && (
        <div className="flex flex-col gap-4">
          {/* Project */}
          <Select
            label="Project *"
            placeholder={loadingProjects ? 'Loading…' : 'Select project…'}
            value={form.projectCode}
            onChange={(v) => set('projectCode', v)}
            options={projects.map((p) => ({ value: p, label: p }))}
            error={errors.projectCode}
          />

          {/* Center Code */}
          <Select
            label="Center Code *"
            placeholder={
              !form.projectCode
                ? 'Select project first'
                : loadingCenters
                  ? 'Loading…'
                  : 'Select center…'
            }
            value={form.centerCode}
            onChange={(v) => set('centerCode', v)}
            options={centers.map((c) => ({ value: c, label: c }))}
            disabled={!form.projectCode || loadingCenters}
            error={errors.centerCode}
          />

          {/* Service */}
          <Select
            label="Service *"
            placeholder={loadingServices ? 'Loading…' : 'Select service…'}
            value={form.serviceName}
            onChange={(v) => set('serviceName', v)}
            options={services.map((s) => ({ value: s, label: s }))}
            error={errors.serviceName}
          />

          {/* Escalation Type — options filtered by selected service */}
          <Select
            label="Escalation Type *"
            placeholder={
              !form.serviceName
                ? 'Select service first'
                : loadingEscalations
                  ? 'Loading…'
                  : escalationTypes.length === 0
                    ? 'No types available'
                    : 'Select escalation type…'
            }
            value={form.escalationType}
            onChange={(v) => set('escalationType', v)}
            options={escalationTypes.map((t) => ({ value: t, label: t }))}
            disabled={!form.serviceName || loadingEscalations}
            error={errors.escalationType}
          />
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          {/* Summary chips */}
          <div className="flex flex-wrap gap-2 p-3 rounded-[10px] bg-[var(--ghost)] border border-[var(--border)]">
            <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-[var(--sage-light)] text-[var(--sage)]">
              {form.projectCode}
            </span>
            <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-[var(--ghost)] border border-[var(--border)] text-[var(--ink-mid)]">
              {form.centerCode}
            </span>
            <span className="text-[0.65rem] px-2 py-0.5 rounded bg-[var(--ghost)] border border-[var(--border)] text-[var(--ink-mid)]">
              {form.serviceName}
            </span>
            <span className="text-[0.65rem] px-2 py-0.5 rounded bg-[var(--ghost)] border border-[var(--border)] text-[var(--ink-mid)]">
              {form.escalationType}
            </span>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
              Description *
            </label>
            <textarea
              rows={4}
              placeholder="Describe the issue in detail…"
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }));
                setErrors((er) => ({ ...er, description: '' }));
              }}
              className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--ghost)]
                         px-3 py-2 text-sm text-[var(--ink)] resize-none outline-none
                         placeholder:text-[var(--ink-light)]
                         focus:border-[var(--sage)] focus:bg-[var(--surface)]
                         transition-colors duration-150"
            />
            {errors.description && (
              <p className="text-xs text-[var(--red)]" role="alert">{errors.description}</p>
            )}
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
              Attachments (optional)
            </label>
            <AttachmentUploader
              value={attachments}
              onChange={setAttachments}
              maxFiles={10}
            />
          </div>

          {/* API error banner */}
          {submitError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px]
                            bg-[#FEF2F2] border border-[#FECACA]">
              <span className="text-[#DC2626] mt-0.5 shrink-0 text-sm leading-none">✕</span>
              <p className="text-xs text-[#DC2626] leading-relaxed">{submitError}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
