import { useEffect, useState }                        from 'react';
import { Modal }                                       from '../../../../components/ui/Modal';
import { Input }                                       from '../../../../components/ui/Input';
import { Select }                                      from '../../../../components/ui/Select';
import { Button }                                      from '../../../../components/ui/Button';
import { Spinner }                                     from '../../../../components/ui/Spinner';
import { ServiceMappingEditor, type MappingRow }       from './ServiceMappingEditor';
import { useActiveProjectCodes, useProjectServices,
         useCreateCenterGrid, useUpdateCenterGrid }    from '../hooks';
import { useCenterGridStore }                          from '../store';
import { centerGridService }                           from '../../../../services/center-grid.service';
import type { CenterGridPayload,
              ServiceMapping }                         from '../../../../services/center-grid.service';

// ── Stable fallback so the serviceNames effect dependency never gets a new
//    reference while the query is disabled / loading (data === undefined).
//    An inline `= []` default creates a new array on every render, which
//    makes useEffect([serviceNames]) fire endlessly → "Maximum update depth".
const NO_SERVICES: string[] = [];

// ── Default form state ─────────────────────────────────────────────────────────

const emptyForm: CenterGridPayload = {
  projectCode:    '',
  centerCode:     '',
  centerName:     '',
  state:          '',
  city:           '',
  centerAddress:  '',
  csupName:       '',
  csupNumber:     '',
  totalCandidate: 0,
  examDates:      '',
  serviceMappings: [],
};

type FieldErrors = Partial<Record<keyof CenterGridPayload | 'form', string>>;

// ── Component ─────────────────────────────────────────────────────────────────

export function CenterGridForm() {
  const { modalOpen, modalMode, editTarget, closeModal } = useCenterGridStore();

  const [form,          setForm]          = useState<CenterGridPayload>(emptyForm);
  const [mappingRows,   setMappingRows]   = useState<MappingRow[]>([]);
  const [fieldErrors,   setFieldErrors]   = useState<FieldErrors>({});
  const [submitting,    setSubmitting]    = useState(false);

  const createMut = useCreateCenterGrid();
  const updateMut = useUpdateCenterGrid();

  const { data: projectCodes = [], isLoading: loadingProjects } = useActiveProjectCodes();

  // Load project services only when a project is selected and modal is open
  const { data: serviceNames = NO_SERVICES, isLoading: loadingServices } = useProjectServices(
    form.projectCode || undefined,
    modalOpen && !!form.projectCode,
  );

  const projectOptions = projectCodes.map((c) => ({ value: c, label: c }));

  // ── Populate on open ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!modalOpen) return;

    if (modalMode === 'edit' && editTarget) {
      setForm({
        projectCode:     editTarget.projectCode,
        centerCode:      editTarget.centerCode,
        centerName:      editTarget.centerName,
        state:           editTarget.state,
        city:            editTarget.city,
        centerAddress:   editTarget.centerAddress,
        csupName:        editTarget.csupName,
        csupNumber:      editTarget.csupNumber,
        totalCandidate:  editTarget.totalCandidate,
        examDates:       editTarget.examDates,
        serviceMappings: editTarget.serviceMappings,
      });
      setMappingRows(
        editTarget.serviceMappings.map((m) => ({
          id:            crypto.randomUUID(),
          service:       m.serviceName,
          deliveryAgent: m.deliveryAgent,
          opsAgent:      m.opsAgent,
        })),
      );
    } else {
      setForm(emptyForm);
      setMappingRows([]);
    }
    setFieldErrors({});
  }, [modalOpen, modalMode, editTarget]);

  // Sync mappingRows whenever serviceNames loads or the project changes.
  // Merges: preserves existing agent values, adds new services with empty agents,
  // and drops services no longer in the project (only relevant on project switch).
  useEffect(() => {
    if (!serviceNames.length) {
      // No services available yet — clear rows so empty-state renders
      setMappingRows([]);
      return;
    }
    setMappingRows((prev) => {
      const prevMap = new Map(prev.map((r) => [r.service, r]));
      return serviceNames.map((svc) =>
        prevMap.get(svc) ?? {
          id:            crypto.randomUUID(),
          service:       svc,
          deliveryAgent: '',
          opsAgent:      '',
        },
      );
    });
  }, [serviceNames]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function patch<K extends keyof CenterGridPayload>(key: K, val: CenterGridPayload[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    setFieldErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validateForm(): boolean {
    const e: FieldErrors = {};
    if (!form.projectCode.trim()) e.projectCode = 'Project is required';
    if (!form.centerCode.trim())  e.centerCode  = 'Center code is required';
    if (!form.centerName.trim())  e.centerName  = 'Center name is required';

    // Agent fields are optional — no row-level errors needed.
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: CenterGridPayload = {
        ...form,
        // Include all service rows — agents may be empty strings (optional)
        serviceMappings: mappingRows.map<ServiceMapping>((r) => ({
          serviceName:   r.service,
          deliveryAgent: r.deliveryAgent.trim(),
          opsAgent:      r.opsAgent.trim(),
        })),
      };

      if (modalMode === 'create') {
        // Check if (projectCode, centerCode) already exists before creating
        const checkRes = await centerGridService.checkExistence(
          payload.projectCode,
          payload.centerCode,
        );
        if (checkRes.data.data === true) {
          setFieldErrors((p) => ({
            ...p,
            centerCode: `Centre "${payload.centerCode}" already exists in project "${payload.projectCode}"`,
          }));
          return;
        }
        await createMut.mutateAsync(payload);
      } else {
        // Edit — use database id from editTarget
        if (!editTarget?.id) throw new Error('Missing id for update');
        await updateMut.mutateAsync({ id: editTarget.id, payload });
      }

      closeModal();
    } catch {
      // Axios interceptor handles global error toast
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isPending = submitting || createMut.isPending || updateMut.isPending;

  return (
    <Modal
      open={modalOpen}
      onClose={closeModal}
      size="xl"
      title={modalMode === 'create' ? 'New Centre Grid' : 'Edit Centre Grid'}
      description="Configure centre details, CSUP contacts and service agent mappings."
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
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Global form error ───────────────────────────────────────────── */}
        {fieldErrors.form && (
          <div className="rounded-[10px] bg-[var(--red-light)] border border-[var(--red)] px-3 py-2">
            <p className="text-xs text-[var(--red)]">{fieldErrors.form}</p>
          </div>
        )}

        {/* ── Project + Center Code ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {loadingProjects ? (
            <div className="flex items-center gap-2 h-9">
              <Spinner size="sm" />
              <span className="text-xs text-[var(--ink-light)]">Loading projects…</span>
            </div>
          ) : (
            <Select
              label="Project"
              placeholder="Select project…"
              options={projectOptions}
              value={form.projectCode}
              onChange={(val) => patch('projectCode', val)}
              error={fieldErrors.projectCode}
              disabled={modalMode === 'edit'}
            />
          )}
          <Input
            label="Center Code"
            placeholder="e.g. CTR-001"
            value={form.centerCode}
            onChange={(e) => patch('centerCode', e.target.value.toUpperCase())}
            error={fieldErrors.centerCode}
            disabled={modalMode === 'edit'}
          />
        </div>

        {/* ── Center Name ──────────────────────────────────────────────────── */}
        <Input
          label="Center Name"
          placeholder="e.g. Delhi North Examination Centre"
          value={form.centerName}
          onChange={(e) => patch('centerName', e.target.value)}
          error={fieldErrors.centerName}
        />

        {/* ── State + City ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="State"
            placeholder="e.g. Maharashtra"
            value={form.state}
            onChange={(e) => patch('state', e.target.value)}
            error={fieldErrors.state}
          />
          <Input
            label="City"
            placeholder="e.g. Mumbai"
            value={form.city}
            onChange={(e) => patch('city', e.target.value)}
            error={fieldErrors.city}
          />
        </div>

        {/* ── Address ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <label className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
            Center Address
          </label>
          <textarea
            rows={2}
            placeholder="Full address…"
            value={form.centerAddress}
            onChange={(e) => patch('centerAddress', e.target.value)}
            className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--ghost)]
                       text-sm text-[var(--ink)] px-3 py-2 outline-none resize-none
                       placeholder:text-[var(--ink-light)] transition-colors
                       focus:border-[var(--sage)] focus:bg-[var(--surface)]"
          />
        </div>

        {/* ── CSUP Name + Number ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="CSUP Name"
            placeholder="Supervisor name"
            value={form.csupName}
            onChange={(e) => patch('csupName', e.target.value)}
            error={fieldErrors.csupName}
          />
          <Input
            label="CSUP Number"
            placeholder="Contact number"
            value={form.csupNumber}
            onChange={(e) => patch('csupNumber', e.target.value)}
            error={fieldErrors.csupNumber}
          />
        </div>

        {/* ── Total Candidates + Exam Dates ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Total Candidates"
            type="number"
            min={0}
            placeholder="e.g. 250"
            value={form.totalCandidate === 0 ? '' : form.totalCandidate}
            onChange={(e) => patch('totalCandidate', Number(e.target.value))}
            error={fieldErrors.totalCandidate}
          />
          <Input
            label="Exam Dates"
            placeholder="e.g. 2026-05-10"
            value={form.examDates}
            onChange={(e) => patch('examDates', e.target.value)}
            error={fieldErrors.examDates}
          />
        </div>

        {/* ── Divider ───────────────────────────────────────────────────────── */}
        <hr className="border-[var(--border)]" />

        {/* ── Service Mappings ─────────────────────────────────────────────── */}
        {loadingServices ? (
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs text-[var(--ink-light)]">Loading project services…</span>
          </div>
        ) : (
          <ServiceMappingEditor
            rows={mappingRows}
            onChange={setMappingRows}
            disabled={isPending}
          />
        )}
      </form>
    </Modal>
  );
}
