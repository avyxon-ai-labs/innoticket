import { useEffect, useState }  from 'react';
import { Plus, Upload }         from 'lucide-react';
import { Button }               from '../components/ui/Button';
import { useNavigationStore }   from '../store/navigationStore';
import { useUserStore }         from '../modules/users/store';
import { UserFilters }          from '../modules/users/components/UserFilters';
import { UserTable }            from '../modules/users/components/UserTable';
import { UserForm }             from '../modules/users/components/UserForm';
import { UserDeleteDialog }     from '../modules/users/components/UserDeleteDialog';
import { UserDetail }           from '../modules/users/components/UserDetail';
import { BulkUploadDialog }     from '../modules/configurations/center-grid/components/BulkUploadDialog';

export function UsersPage() {
  const { current, resetStack } = useNavigationStore();
  const { openCreate }          = useUserStore();
  const [bulkOpen, setBulkOpen] = useState(false);

  // Initialise the navigation stack for this module on mount
  useEffect(() => {
    resetStack({ module: 'users', subView: 'list' });
  }, [resetStack]);

  // ── Sub-view: Detail ──────────────────────────────────────────────────────

  if (current?.module === 'users' && current.subView === 'detail' && current.selectedId) {
    return (
      <>
        <UserDetail userId={Number(current.selectedId)} />
        {/* Form stays mounted so edit modal works from detail view too */}
        <UserForm />
      </>
    );
  }

  // ── Default: List ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. Title card ───────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-4
                      flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">User Management</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage system users, roles and access status.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload size={14} />}
            onClick={() => setBulkOpen(true)}
          >
            Bulk Upload
          </Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
            New User
          </Button>
        </div>
      </div>

      {/* ── 2. Filters card ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-3">
        <UserFilters />
      </div>

      {/* ── 3. Table card ───────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden">
        <UserTable flat />
      </div>

      {/* Modals */}
      <UserForm />
      <UserDeleteDialog />
      <BulkUploadDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        jobType="BULK_USER_ADD"
        title="Bulk Upload — Users"
        subtitle="Upload an Excel file to create or update multiple users at once."
        templateFileName="bulk_user_template.xlsx"
        doneMessage="✓ User data updated."
      />
    </div>
  );
}
