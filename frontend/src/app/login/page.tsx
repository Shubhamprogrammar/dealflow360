'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { api } from '@/lib/api/apiClient';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [tab, setTab] = useState<'staff' | 'customer'>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const { login } = useSession();
  const router = useRouter();

  const switchTab = (next: 'staff' | 'customer') => {
    setTab(next);
    setError('');
    setLinkSent(false);
  };

  const handleStaffLogin = async () => {
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  // Magic link is the only customer auth path. Always show the same message.
  const handleCustomerRequestLink = async () => {
    try {
      await api.post('/auth/customer/request-link', { email }, true);
    } catch {
      // Swallow — the response is intentionally identical either way, and we
      // never want to hint at whether the email is registered.
    }
    setLinkSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'staff' && (!email || !password)) return;
    if (tab === 'customer' && !email) return;

    setSubmitting(true);
    setError('');
    if (tab === 'staff') await handleStaffLogin();
    else await handleCustomerRequestLink();
    setSubmitting(false);
  };

  const doDemoLogin = async (loginEmail: string) => {
    setSubmitting(true);
    setEmail(loginEmail);
    setPassword('dealflow'); // The seeded password in the backend
    try {
      await login(loginEmail, 'dealflow');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setSubmitting(false);
    }
  };

  const inputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">
            DealFlow<span className="text-blue-600">360</span>
          </span>
          <p className="mt-2 text-sm text-slate-500">Entry point for internal users and customers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="mb-6 inline-flex w-full rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => switchTab('staff')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => switchTab('customer')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Customer
            </button>
          </div>

          {tab === 'customer' && linkSent ? (
            <div className="grid gap-3 text-center">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Check your email for a login link. It expires in a few minutes and can only be used once.
              </div>
              <button
                type="button"
                onClick={() => setLinkSent(false)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </label>

              {tab === 'staff' && (
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </label>
              )}

              {tab === 'customer' && (
                <p className="text-xs text-slate-500">
                  We&apos;ll email you a secure sign-in link — no password needed.
                </p>
              )}

              <Button type="submit" variant="primary" disabled={submitting} className="mt-1 w-full">
                {submitting
                  ? 'Please wait…'
                  : tab === 'staff'
                    ? 'Log In'
                    : 'Send me a link'}
              </Button>
            </form>
          )}

          {tab === 'staff' && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                Demo admin login
              </p>
              <button
                onClick={() => doDemoLogin('admin@dealflow.com')}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
              >
                Login as Admin (admin@dealflow.com)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
