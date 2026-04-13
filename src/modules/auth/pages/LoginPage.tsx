import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { Input }         from '../../../components/ui/Input';
import { Button }        from '../../../components/ui/Button';
import { PasswordInput } from '../components/PasswordInput';
import { AuthCard }      from '../components/AuthCard';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [form, setForm]           = useState({ username: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
      clearError();
    };

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!form.username.trim()) errs.username = 'Email is required.';
    if (!form.password)        errs.password = 'Password is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form);
      navigate('/', { replace: true });
    } catch { /* error handled in store */ }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account to continue."
    >
      {error && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] bg-[var(--red-light)] border border-[var(--red)]/20 animate-[fadeUp_0.2s_ease]">
          <AlertCircle size={14} className="text-[var(--red)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--red)] font-medium leading-snug">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          value={form.username}
          onChange={set('username')}
          error={fieldErrors.username}
        />

        <div className="flex flex-col gap-1">
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
            error={fieldErrors.password}
          />
          <div className="flex justify-end mt-0.5">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[var(--sage)] hover:underline underline-offset-2 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={isLoading} size="lg" className="mt-1">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
