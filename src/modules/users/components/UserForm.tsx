import { useEffect, useState }           from 'react';
import { Modal }                          from '../../../components/ui/Modal';
import { Input }                          from '../../../components/ui/Input';
import { Select }                         from '../../../components/ui/Select';
import { Button }                         from '../../../components/ui/Button';
import { PasswordInput }                  from '../../auth/components/PasswordInput';
import { useCreateUser, useUpdateUser }   from '../hooks';
import { useUserStore }                   from '../store';
import type { UserPayload }               from '../../../services/user.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'ADMIN',  label: 'Admin'  },
  { value: 'USER',   label: 'User'   },
  { value: 'CLIENT', label: 'Client' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'INACTIVE', label: 'Inactive' },
];

const USER_GROUP_OPTIONS = [
  { value: '',         label: 'None'     },
  { value: 'OPS',      label: 'OPS'      },
  { value: 'DELIVERY', label: 'Delivery' },
];

// ── Default ───────────────────────────────────────────────────────────────────

const empty: UserPayload = {
  fullName:            '',
  username:            '',
  password:            '',
  contact:             '',
  post:                '',
  managerUsername:     '',
  roleCode:            'USER',
  status:              'ACTIVE',
  isTemporaryPassword: true,
  projectCode:         null,
  userGroup:           null,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function UserForm() {
  const { modalOpen, modalMode, editTarget, closeModal } = useUserStore();

  const [form,   setForm]   = useState<UserPayload>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof UserPayload, string>>>({});

  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const isPending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (modalMode === 'edit' && editTarget) {
      setForm({
        fullName:            editTarget.fullName,
        username:            editTarget.username,
        password:            '',   // never pre-fill — always requires intentional entry
        contact:             editTarget.contact,
        post:                editTarget.post,
        managerUsername:     editTarget.managerUsername ?? '',
        roleCode:            editTarget.roleCode,
        status:              editTarget.status,
        isTemporaryPassword: editTarget.isTemporaryPassword,
        projectCode:         editTarget.projectCode ?? null,
        userGroup:           editTarget.userGroup   ?? null,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [modalOpen, modalMode, editTarget]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function patch<K extends keyof UserPayload>(key: K, val: UserPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (modalMode === 'create' && !form.password.trim())
      e.password = 'Temporary password is required';
    if (!form.roleCode) e.roleCode = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload: UserPayload = {
        ...form,
        managerUsername: form.managerUsername?.trim() || '',
        projectCode:     form.projectCode?.trim()     || null,
      };
      if (modalMode === 'create') {
        await createMut.mutateAsync(payload);
      } else {
        await updateMut.mutateAsync({ id: editTarget!.id, payload });
      }
      closeModal();
    } catch {
      // Axios interceptor handles global error
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={modalOpen}
      onClose={closeModal}
      title={modalMode === 'create' ? 'New User' : 'Edit User'}
      description="Manage user identity, role, group and access status."
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
            {modalMode === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Full Name + Username */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Full Name"
            placeholder="e.g. Jane Smith"
            value={form.fullName}
            onChange={(e) => patch('fullName', e.target.value)}
            error={errors.fullName}
          />
          <Input
            label="Username"
            placeholder="e.g. jane@example.com"
            value={form.username}
            onChange={(e) => patch('username', e.target.value.toLowerCase())}
            error={errors.username}
            disabled={modalMode === 'edit'} // username immutable on edit
          />
        </div>

        {/* Temporary Password */}
        <PasswordInput
          label="Temporary Password"
          placeholder="Set a temporary password"
          value={form.password}
          onChange={(e) => patch('password', e.target.value)}
          error={errors.password}
          hint={modalMode === 'edit' ? 'Leave blank to keep existing password, or enter a new one to reset it.' : undefined}
        />

        {/* Contact + Post */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Contact"
            placeholder="e.g. 9876543210"
            value={form.contact}
            onChange={(e) => patch('contact', e.target.value)}
            error={errors.contact}
          />
          <Input
            label="Post / Designation"
            placeholder="e.g. Network Engineer"
            value={form.post}
            onChange={(e) => patch('post', e.target.value)}
            error={errors.post}
          />
        </div>

        {/* Manager Username */}
        <Input
          label="Manager Username"
          placeholder="e.g. manager@example.com (optional)"
          value={form.managerUsername}
          onChange={(e) => patch('managerUsername', e.target.value.toLowerCase())}
          error={errors.managerUsername}
        />

        {/* Role + Status */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.roleCode}
            onChange={(val) => patch('roleCode', val as UserPayload['roleCode'])}
            error={errors.roleCode}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(val) => patch('status', val as UserPayload['status'])}
            error={errors.status}
          />
        </div>

        {/* User Group + Project Code (Project Code only for CLIENT role) */}
        <div className={form.roleCode === 'CLIENT' ? 'grid grid-cols-2 gap-3' : ''}>
          <Select
            label="User Group"
            options={USER_GROUP_OPTIONS}
            value={form.userGroup ?? ''}
            onChange={(val) =>
              patch('userGroup', (val as UserPayload['userGroup']) || null)
            }
          />
          {form.roleCode === 'CLIENT' && (
            <Input
              label="Project Code"
              placeholder="e.g. PRJ001 (optional)"
              value={form.projectCode ?? ''}
              onChange={(e) =>
                patch('projectCode', e.target.value.toUpperCase() || null)
              }
              error={errors.projectCode}
            />
          )}
        </div>

        {/* Temporary Password toggle */}
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)]
                        bg-[var(--ghost)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">Temporary Password</p>
            <p className="text-xs text-[var(--ink-light)]">
              User will be prompted to change password on next login
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isTemporaryPassword}
            onClick={() => patch('isTemporaryPassword', !form.isTemporaryPassword)}
            className={[
              'relative w-10 h-[22px] rounded-full transition-colors duration-200 outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
              form.isTemporaryPassword ? 'bg-[var(--sage)]' : 'bg-[var(--border)]',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow',
                'transition-transform duration-200',
                form.isTemporaryPassword ? 'translate-x-[18px]' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>

      </form>
    </Modal>
  );
}
