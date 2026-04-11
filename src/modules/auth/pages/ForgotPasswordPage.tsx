import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../../services/auth.service';
import { Input }       from '../../../components/ui/Input';
import { Button }      from '../../../components/ui/Button';
import { AuthCard }    from '../components/AuthCard';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus]     = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await authService.forgotPassword({ username: username.trim() });
      setStatus('success');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Something went wrong. Please try again.';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center gap-4 py-2 animate-[fadeUp_0.25s_ease]">
          <div className="w-12 h-12 rounded-full bg-[var(--sage-light)] flex items-center justify-center">
            <CheckCircle2 size={22} className="text-[var(--sage)]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--ink)]"
              style={{ fontFamily: 'var(--font-display)' }}>
              Check your inbox
            </h2>
            <p className="text-sm text-[var(--ink-light)] leading-relaxed">
              If <strong className="text-[var(--ink-mid)] font-medium">{username}</strong> is
              registered, a reset link is on its way.
            </p>
          </div>
          <Link to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sage)] hover:underline underline-offset-2">
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {status === 'error' && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] bg-[var(--red-light)] border border-[var(--red)]/20 animate-[fadeUp_0.2s_ease]">
          <AlertCircle size={14} className="text-[var(--red)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--red)] font-medium">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button type="submit" fullWidth loading={status === 'loading'} size="lg">
          Send reset link
        </Button>
      </form>

      <div className="flex justify-center">
        <Link to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
