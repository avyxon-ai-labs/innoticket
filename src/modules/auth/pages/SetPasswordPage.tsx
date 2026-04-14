import { useState }                           from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2,
         ArrowLeft, ShieldAlert }             from 'lucide-react';
import { authService }                        from '../../../services/auth.service';
import { useAuthStore }                       from '../../../store/authStore';
import { Button }                             from '../../../components/ui/Button';
import { PasswordInput }                      from '../components/PasswordInput';
import { AuthCard }                           from '../components/AuthCard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState   { newPassword: string; confirmPassword: string; }
interface FieldErrors { newPassword?: string; confirmPassword?: string; }

// ── Component ─────────────────────────────────────────────────────────────────

export function SetPasswordPage() {
  const [searchParams]   = useSearchParams();
  const navigate         = useNavigate();
  const logout           = useAuthStore((s) => s.logout);
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated);

  const token = searchParams.get('token') ?? '';

  const [form,        setForm]        = useState<FormState>({ newPassword: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError,    setApiError]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);

  // If someone opens this link while logged in, sign them out immediately
  // so they cannot slide into the dashboard from this page.
  if (isAuthenticated) {
    logout();
  }

  // ── No token in URL ───────────────────────────────────────────────────────

  if (!token) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center gap-4 py-2 animate-[fadeUp_0.25s_ease]">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center">
            <ShieldAlert size={22} className="text-[#DC2626]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--ink)]"
                style={{ fontFamily: 'var(--font-display)' }}>
              Invalid reset link
            </h2>
            <p className="text-sm text-[var(--ink-light)] leading-relaxed">
              This link is missing a reset token. Please request a new password reset.
            </p>
          </div>
          <Link to="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm font-medium
                       text-[var(--sage)] hover:underline underline-offset-2">
            Request a new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (success) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center gap-4 py-2 animate-[fadeUp_0.25s_ease]">
          <div className="w-12 h-12 rounded-full bg-[var(--sage-light)] flex items-center justify-center">
            <CheckCircle2 size={22} className="text-[var(--sage)]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--ink)]"
                style={{ fontFamily: 'var(--font-display)' }}>
              Password updated!
            </h2>
            <p className="text-sm text-[var(--ink-light)] leading-relaxed">
              Your password has been set successfully.
              <br />
              Sign in with your new credentials.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/login', { replace: true })}
          >
            Go to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!form.newPassword)
      errs.newPassword = 'New password is required.';
    else if (form.newPassword.length < 6)
      errs.newPassword = 'At least 6 characters required.';

    if (!form.confirmPassword)
      errs.confirmPassword = 'Please confirm your new password.';
    else if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    try {
      await authService.setPassword({ token, newPassword: form.newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Failed to reset password. The link may have expired.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <AuthCard
      title="Set new password"
      subtitle="Choose a strong password for your account."
    >
      {apiError && (
        <div className="flex flex-col gap-2 px-3 py-2.5 rounded-[10px]
                        bg-[var(--red-light)] border border-[var(--red)]/20
                        animate-[fadeUp_0.2s_ease]">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-[var(--red)] mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--red)] font-medium">{apiError}</p>
          </div>
          {/* Invite to request a fresh link on token errors */}
          {/invalid|expired/i.test(apiError) && (
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[var(--red)] underline underline-offset-2
                         hover:opacity-80 transition-opacity self-start pl-5"
            >
              Request a new reset link →
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordInput
          label="New Password"
          placeholder="••••••••"
          autoComplete="new-password"
          autoFocus
          value={form.newPassword}
          onChange={(e) => {
            setForm((f) => ({ ...f, newPassword: e.target.value }));
            setFieldErrors((fe) => ({ ...fe, newPassword: undefined }));
            setApiError('');
          }}
          error={fieldErrors.newPassword}
        />
        <PasswordInput
          label="Confirm New Password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => {
            setForm((f) => ({ ...f, confirmPassword: e.target.value }));
            setFieldErrors((fe) => ({ ...fe, confirmPassword: undefined }));
          }}
          error={fieldErrors.confirmPassword}
        />
        <Button type="submit" fullWidth loading={loading} size="lg" className="mt-1">
          Set password
        </Button>
      </form>

      <div className="flex justify-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-light)]
                     hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
