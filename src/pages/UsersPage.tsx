import { useEffect }            from 'react';
import { Plus }                 from 'lucide-react';
import { Button }               from '../components/ui/Button';
import { useNavigationStore }   from '../store/navigationStore';
import { useUserStore }         from '../modules/users/store';
import { UserFilters }          from '../modules/users/components/UserFilters';
import { UserTable }            from '../modules/users/components/UserTable';
import { UserForm }             from '../modules/users/components/UserForm';
import { UserDeleteDialog }     from '../modules/users/components/UserDeleteDialog';
import { UserDetail }           from '../modules/users/components/UserDetail';

export function UsersPage() {
  const { current, resetStack } = useNavigationStore();
  const { openCreate }          = useUserStore();

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
    <div className="flex flex-col gap-6 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">
            User Management
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ink-light)]">
            Manage system users, roles and access status.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          New User
        </Button>
      </div>

      {/* Filters */}
      <UserFilters />

      {/* Table */}
      <div className="flex-1 min-h-0">
        <UserTable />
      </div>

      {/* Modals */}
      <UserForm />
      <UserDeleteDialog />
    </div>
  );
}
