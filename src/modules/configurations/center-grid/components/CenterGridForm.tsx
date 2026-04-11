import { useEffect, useState }                        from 'react';
import { Modal }                                       from '../../../../components/ui/Modal';
import { Input }                                       from '../../../../components/ui/Input';
import { Select }                                      from '../../../../components/ui/Select';
import { Button }                                      from '../../../../components/ui/Button';
import { Spinner }                                     from '../../../../components/ui/Spinner';
import { ServiceMappingEditor, type MappingRow }       from './ServiceMappingEditor';
import { useActiveProjectCodes, useActiveServiceNames,
         useCreateCenterGrid, useUpdateCenterGrid }    from '../hooks';
import { useCenterGridStore }                          from '../store';
import { centerGridService }                           from '../../../../services/center-grid.service';
import type { CenterGridPayload }                      from '../../../../services/center-grid.service';

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
  serviceMappings: {},
};

type FieldErrors = Partial<Record<keyof CenterGridPayload | 'form', string>>;

// ── Component ─────────────────────────────────────────────────────────────────

export function CenterGridForm() {
  const { modalOpen, modalMode, editTarget, closeModal } = useCenterGridStore();

  const [form,          setForm]       = useState<CenterGridPayload>(emptyForm);
  const [mappingRows,   setMappingRows] = useState<MappingRow[]>([]);
  const [fieldErrors,   setFieldErrors] = useState<FieldErrors>({});
  const [mappingErrors, setMappingErrors] = useState<Record<string, string>>({});
  const [submitting,    setSubmitting]    = useState(false);

  const createMut = useCreateCenterGrid();
  const updateMut = useUpdateCenterGrid();

  const { data: projectCodes = [], isLoading: loadingProjects } = useActiveProjectCodes();
  const { data: serviceNames  = [], isLoading: loadingServices } = useActiveServiceNames();

  const projectOptions = projectCodes.map((c) => ({ value: c, label: c }));

  // ── Populate on open ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!modalOpen) return;

    if (modalMode === 'edit' && editTarget) {
      setForm({
        projectCode:    editTarget.projectCode,
        centerCode:     editTarget.centerCode,
        centerName:     editTarget.centerName,
        state:          editTarget.state,
        city:           editTarget.city,
        centerAddress:  editTarget.centerAddress,
        csupName:       editTarget.csupName,
        csupNumber:     editTarget.csupNumber,
        totalCandidate: editTarget.totalCandidate,
        examDates:      editTarget.examDates,
        serviceMappings: editTarget.serviceMappings,
      });
      setMappingRows(
        Object.entries(editTarget.serviceMappings).map(([service, email]) => ({
          id: crypto.randomUUID(),
          service,
          email,
        })),
      );
    } else {
      setForm(emptyForm);
      setMappingRows([]);
    }
    setFieldErrors({});
    setMappingErrors({});
  }, [modalOpen, modalMode, editTarget]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function patch<K extends keyof CenterGridPayload>(key: K, val: CenterGridPayload[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    setFieldErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validateForm(): boolean {
    const e: FieldErrors = {};
    if (!form.projectCode.trim())  e.projectCode  = 'Project is required';
    if (!form.centerCode.trim())   e.centerCode   = 'Center code is required';
    if (!form.centerName.trim())   e.centerName   = 'Center name is required';

    // Validate each mapping row locally
    const mErr: Record<string, string> = {};
    for (const row of mappingRows) {
      if (!row.service) {
        mErr[row.id] = 'Select a service';
      } else if (!row.email.trim()) {
        mErr[row.id] = 'Agent email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        mErr[row.id] = 'Enter a valid email';
      }
    }
    // Duplicate service check within the form
    const seen = new Set<string>();
    for (const row of mappingRows) {
      if (row.service) {
        if (seen.has(row.service)) mErr[row.id] = `"${row.service}" is already added`;
        else seen.add(row.service);
      }
    }

    setFieldErrors(e);
    setMappingErrors(mErr);
    return Object.keys(e).length === 0 && Object.keys(mErr).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const isCreate = modalMode === 'create';

      // ── Pre-save existence check (create only) ─────────────────────────────
      if (isCreate) {
        const existRes = await centerGridService.checkExistence(
          form.projectCode,
          form.centerCode,
        );
        if (existRes.data.data === true) {
          setFieldErrors((p) => ({
            ...p,
            form: `Center "${form.centerCode}" already exists in project "${form.projectCode}"`,
          }));
          setSubmitting(false);
          return;
        }
      }

      // ── Pre-save service-in-center check ──────────────────────────────────
      // On create: check all rows. On edit: check only newly-added services.
      const originalServices = isCreate
        ? new Set<string>()
        : new Set(Object.keys(editTarget!.serviceMappings));

      const mErr: Record<string, string> = {};
      for (const row of mappingRows) {
        if (row.service && !originalServices.has(row.service)) {
          const svcRes = await centerGridService.checkService(
            form.projectCode,
            form.centerCode,
            row.service,
          );
          if (svcRes.data.data === true) {
            mErr[row.id] = `"${row.service}" is already mapped to this center`;
          }
        }
      }
      if (Object.keys(mErr).length > 0) {
        setMappingErrors(mErr);
        setSubmitting(false);
        return;
      }

      // ── Build payload ──────────────────────────────────────────────────────
      const serviceMappings: Record<string, string> = {};
      for (const row of mappingRows) {
        if (row.service) serviceMappings[row.service] = row.email;
      }

      const payload: CenterGridPayload = { ...form, serviceMappings };

      if (isCreate) {
        await createMut.mutateAsync(payload);
      } else {
        await updateMut.mutateAsync({ id: editTarget!.id, payload });
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
      description="Configure centre details, CSUP contacts and service escalation mappings."
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
            placeholder="e.g. Delhi"
            value={form.state}
            onChange={(e) => patch('state', e.target.value)}
            error={fieldErrors.state}
          />
          <Input
            label="City"
            placeholder="e.g. New Delhi"
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
            placeholder="e.g. 2026-05-10, 2026-05-11"
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
            <span className="text-xs text-[var(--ink-light)]">Loading services…</span>
          </div>
        ) : (
          <ServiceMappingEditor
            rows={mappingRows}
            onChange={setMappingRows}
            availableServices={serviceNames}
            errors={mappingErrors}
            disabled={isPending}
          />
        )}
      </form>
    </Modal>
  );
}
