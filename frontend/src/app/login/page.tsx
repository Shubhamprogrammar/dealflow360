'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { mockLogin } from '@/lib/mock/server';
import { Button } from '@/components/ui/Button';
import type { Role } from '@/types';

const DEMO_ACCOUNTS: { role: Role; email: string; label: string }[] = [
  { role: 'Rep', email: 'rep@dealflow360.demo', label: 'Sales Rep' },
  { role: 'SalesManager', email: 'manager@dealflow360.demo', label: 'Sales Manager' },
  { role: 'FinanceOps', email: 'finance@dealflow360.demo', label: 'Finance / Ops' },
  { role: 'Admin', email: 'admin@dealflow360.demo', label: 'Admin' },
];

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useSession();
  const router = useRouter();

  const doLogin = async (loginEmail: string) => {
    setSubmitting(true);
    try {
      const user = await mockLogin(loginEmail);
      login(user);
      router.push('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    doLogin(email);
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
              onClick={() => setMode('login')}
              className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
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

            <div className="mt-1 flex items-center justify-between gap-3">
              <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </Button>
            </div>
            <button type="button" className="text-center text-sm text-blue-600 hover:text-blue-700">
              Forgot password?
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Demo quick login (internal roles)
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => doLogin(acc.email)}
                  disabled={submitting}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
                >
                  {acc.label}
                </button>
              ))}
              <button
                onClick={() => router.push('/portal')}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Customer Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
