'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, saveTokens } from '@/lib/api/apiClient';
import { saveCustomerSession } from '@/lib/auth/tokenStore';
import { Button } from '@/components/ui/Button';

type VerifyResponse = {
  accessToken: string;
  customerId: string;
  companyName: string;
  redirect: string;
};

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const started = useRef(false);
  // No token at all is immediately an error -- decided at first render so the
  // effect never has to setState synchronously for it.
  const [status, setStatus] = useState<'loading' | 'error'>(token ? 'loading' : 'error');

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;

    api
      .get<VerifyResponse>(`/auth/customer/verify?token=${encodeURIComponent(token)}`, true)
      .then((res) => {
        const { accessToken, customerId, companyName, redirect } = res.data;
        saveTokens(accessToken);
        saveCustomerSession({ accessToken, customerId, companyName });
        router.replace(redirect || '/portal/catalog');
      })
      .catch(() => setStatus('error'));
  }, [token, router]);

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-xl font-semibold tracking-tight text-slate-900">
          DealFlow<span className="text-blue-600">360</span>
        </div>

        {status === 'loading' ? (
          <p className="text-sm text-slate-500">Signing you in…</p>
        ) : (
          <div className="grid gap-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Link expired or invalid — request a new one.
            </div>
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Back to login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalVerifyPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-slate-500">Signing you in…</p>}>
      <VerifyInner />
    </Suspense>
  );
}
