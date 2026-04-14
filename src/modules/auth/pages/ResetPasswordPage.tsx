import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService }   from '../../../services/auth.service';
import { useAuthStore }  from '../../../store/authStore';
import { Button }        from '../../../components/ui/Button';
import { PasswordInput } from '../components/PasswordInput';
import { AuthCard }      from '../components/AuthCard';

interface FormState   { oldPassword: string; newPassword: string; confirmPassword: string; }
interface FieldErrors { oldPassword?: string; newPassword?: string; confirmPassword?: string; }

export function ResetPasswordPage() {
  const navigate  = useNavigate();
  const logout    = useAuthStore((s) => s.logout);
  const [form, setForm]         = useState<FormState>({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [fieldErrors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError]  = useState('');
  const [loading, setLoading]    = useState(false);
  const [success, setSuccess]    = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((fe) => ({ ...fe, [field]: undefined }));
    setApiError('');
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!form.oldPassword)     errs.oldPassword     = 'Current password is required.';
    if (!form.newPassword)     errs.newPassword     = 'New password is required.';
    else if (form.newPassword.length < 6)
                               errs.newPassword     = 'At least 6 characters.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your new password.';
    else if (form.newPassword !== form.confirmPassword)
                               errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.resetPassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
      // Show success screen first, then clear the flag after the delay.
      // fetchMe sets isTemporaryPassword=false, which causes ProtectedLayout
      // to unmount this component — so it must happen after the success UI is shown.
      setSuccess(true);
      setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to reset password. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center gap-4 py-2 animate-[fadeUp_0.25s_ease]">
          <div className="w-12 h-12 rounded-full bg-[var(--sage-light)] flex items-center justify-center">
            <CheckCircle2 size={22} className="text-[var(--sage)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--ink)]"
              style={{ fontFamily: 'var(--font-display)' }}>
              Password updated!
            </h2>
            <p className="text-sm text-[var(--ink-light)] mt-1">Redirecting to login…</p>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      subtitle="Choose a strong password for your account."
    >
      {apiError && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] bg-[var(--red-light)] border border-[var(--red)]/20 animate-[fadeUp_0.2s_ease]">
          <AlertCircle size={14} className="text-[var(--red)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--red)] font-medium">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordInput label="Current Password" placeholder="••••••••"
          autoComplete="current-password" value={form.oldPassword}
          onChange={set('oldPassword')} error={fieldErrors.oldPassword} />
        <PasswordInput label="New Password" placeholder="••••••••"
          autoComplete="new-password" value={form.newPassword}
          onChange={set('newPassword')} error={fieldErrors.newPassword} />
        <PasswordInput label="Confirm New Password" placeholder="••••••••"
          autoComplete="new-password" value={form.confirmPassword}
          onChange={set('confirmPassword')} error={fieldErrors.confirmPassword} />
        <Button type="submit" fullWidth loading={loading} size="lg" className="mt-1">
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
