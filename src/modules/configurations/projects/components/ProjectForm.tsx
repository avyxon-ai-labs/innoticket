import { useEffect, useState }       from 'react';
import { Modal }                      from '../../../../components/ui/Modal';
import { Input }                      from '../../../../components/ui/Input';
import { Select }                     from '../../../../components/ui/Select';
import { Button }                     from '../../../../components/ui/Button';
import { PasswordInput }              from '../../../auth/components/PasswordInput';
import { useCreateProject, useUpdateProject } from '../hooks';
import { useProjectStore }            from '../store';
import type { ProjectPayload }        from '../../../../services/project.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'INACTIVE', label: 'Inactive' },
];

// ── Defaults ──────────────────────────────────────────────────────────────────

const empty: ProjectPayload = {
  projectName:    '',
  projectCode:    '',
  password:       '',
  status:         'ACTIVE',
  slaLevel1Hours: 0,
  slaLevel2Hours: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectForm() {
  const { modalOpen, modalMode, editTarget, closeModal } = useProjectStore();

  const [form,   setForm]   = useState<ProjectPayload>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectPayload, string>>>({});

  const createMut = useCreateProject();
  const updateMut = useUpdateProject();
  const isPending = createMut.isPending || updateMut.isPending;

  // Populate on edit
  useEffect(() => {
    if (modalMode === 'edit' && editTarget) {
      setForm({
        projectName:    editTarget.projectName,
        projectCode:    editTarget.projectCode,
        password:       editTarget.password,
        status:         editTarget.status,
        slaLevel1Hours: editTarget.slaLevel1Hours,
        slaLevel2Hours: editTarget.slaLevel2Hours,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [modalOpen, modalMode, editTarget]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function patch<K extends keyof ProjectPayload>(key: K, val: ProjectPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.projectName.trim()) e.projectName = 'Project name is required';
    if (!form.projectCode.trim()) e.projectCode = 'Project code is required';
    if (!form.password.trim())    e.password    = 'Password is required';
    if (form.slaLevel1Hours < 0)  e.slaLevel1Hours = 'Must be ≥ 0';
    if (form.slaLevel2Hours < 0)  e.slaLevel2Hours = 'Must be ≥ 0';
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
      // Axios interceptor handles global error
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={modalOpen}
      onClose={closeModal}
      title={modalMode === 'create' ? 'New Project' : 'Edit Project'}
      description="Configure project details and SLA thresholds."
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
        {/* Row: Project Name + Code */}
        <div className="grid grid-cols-2 gap-3">
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

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Project access password"
          value={form.password}
          onChange={(e) => patch('password', e.target.value)}
          error={errors.password}
        />

        {/* Status */}
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(val) => patch('status', val as ProjectPayload['status'])}
          error={errors.status}
        />

        {/* SLA Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Input
              label="SLA Level 1 (Hours)"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 4"
              value={form.slaLevel1Hours === 0 ? '' : form.slaLevel1Hours}
              onChange={(e) => patch('slaLevel1Hours', Math.max(0, Math.floor(Number(e.target.value))))}
              error={errors.slaLevel1Hours}
            />
            {form.slaLevel1Hours > 10 && (
              <p className="text-[0.68rem] text-[#D97706] flex items-center gap-1">
                ⚠ High SLA threshold — consider if this is intentional.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Input
              label="SLA Level 2 (Hours)"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 8"
              value={form.slaLevel2Hours === 0 ? '' : form.slaLevel2Hours}
              onChange={(e) => patch('slaLevel2Hours', Math.max(0, Math.floor(Number(e.target.value))))}
              error={errors.slaLevel2Hours}
            />
            {form.slaLevel2Hours > 10 && (
              <p className="text-[0.68rem] text-[#D97706] flex items-center gap-1">
                ⚠ High SLA threshold — consider if this is intentional.
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
