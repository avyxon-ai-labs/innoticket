import { ArrowLeft, Pencil }     from 'lucide-react';
import { Button }                from '../../../components/ui/Button';
import { Badge }                 from '../../../components/ui/Badge';
import { Spinner }               from '../../../components/ui/Spinner';
import { useNavigationStore }    from '../../../store/navigationStore';
import { useUserStore }          from '../store';
import { useUserById }           from '../hooks';
import { formatLocalDateTime }   from '../../../utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-light)] mb-4">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UserDetail({ userId }: { userId: number }) {
  const { popView }  = useNavigationStore();
  const { openEdit } = useUserStore();

  const { data: user, isLoading, isError } = useUserById(userId);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-[var(--ink-mid)]">Failed to load user details.</p>
        <Button variant="outline" size="sm" onClick={popView}>Go back</Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={popView}
          className="p-2 rounded-[10px] text-[var(--ink-light)] hover:bg-[var(--ghost)]
                     hover:text-[var(--ink)] transition-colors duration-150"
          aria-label="Back to users"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--ink)] truncate">{user.fullName}</h1>
            <Badge
              variant={user.status === 'ACTIVE' ? 'open' : 'closed'}
              label={user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            />
            {user.isTemporaryPassword && (
              <Badge variant="pending" label="Temp Password" dot={false} />
            )}
          </div>
          <p className="text-sm text-[var(--ink-light)] mt-0.5">{user.post || 'No designation'}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Pencil size={13} />}
          onClick={() => openEdit(user)}
        >
          Edit
        </Button>
      </div>

      {/* Identity */}
      <Section title="Identity">
        <Field label="Full Name"  value={user.fullName} />
        <Field label="Username"   value={
          <span className="font-mono text-sm">{user.username}</span>
        } />
        <Field label="Contact"    value={user.contact || '—'} />
        <Field label="Post"       value={user.post    || '—'} />
        <Field label="Manager"    value={user.managerUsername || '—'} />
        <Field label="Role"       value={
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold
                           bg-[var(--sage-light)] text-[var(--sage)] font-mono tracking-wide">
            {user.roleCode}
          </span>
        } />
        <Field label="Group"      value={
          user.userGroup
            ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold
                               font-mono tracking-wide"
                   style={{
                     backgroundColor: user.userGroup === 'OPS' ? '#EFF6FF' : '#F0FDF4',
                     color:           user.userGroup === 'OPS' ? '#1D4ED8' : '#15803D',
                   }}>
                {user.userGroup}
              </span>
            )
            : '—'
        } />
        {user.roleCode === 'CLIENT' && (
          <Field label="Project Code" value={
            user.projectCode
              ? <span className="font-mono text-sm">{user.projectCode}</span>
              : '—'
          } />
        )}
      </Section>

      {/* Access */}
      <Section title="Access">
        <Field label="Status" value={
          <Badge
            variant={user.status === 'ACTIVE' ? 'open' : 'closed'}
            label={user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          />
        } />
        <Field label="Temporary Password" value={user.isTemporaryPassword ? 'Yes' : 'No'} />
        <Field label="Last Login"         value={
          user.lastLogin ? formatLocalDateTime(user.lastLogin) : 'Never'
        } />
      </Section>

      {/* Audit */}
      <Section title="Audit">
        <Field label="Created At" value={formatLocalDateTime(user.createdAt)} />
        <Field label="Created By" value={user.createdBy} />
        <Field label="Updated At" value={formatLocalDateTime(user.updatedAt)} />
        <Field label="Updated By" value={user.updatedBy} />
      </Section>
    </div>
  );
}
