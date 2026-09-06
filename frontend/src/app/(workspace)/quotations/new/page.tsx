'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { quotationService } from '@/services/quotationService';
import { ApiError } from '@/lib/api/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

// Bridge screen: the pipeline "New Inquiry" card links here with
// ?fromInquiry=<id>. We create the pre-filled draft quotation on the server
// and hand off to the normal Quotation Builder. Nothing to configure here.
export default function NewQuotationFromInquiryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const inquiryId = params.get('fromInquiry');
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!inquiryId) {
      router.replace('/quotations');
      return;
    }

    quotationService
      .createFromInquiry(inquiryId)
      .then((quotation) => {
        queryClient.invalidateQueries({ queryKey: ['quotations'] });
        queryClient.invalidateQueries({ queryKey: ['inquiries'] });
        router.replace(`/quotations/${quotation.id}`);
      })
      .catch((e: unknown) => {
        // Both cases land here: 404 (a requested product went inactive, message
        // names it) and 409 (another rep already converted it). The backend
        // message is already user-facing, so just show it.
        const message =
          e instanceof ApiError || e instanceof Error
            ? e.message
            : 'Could not create the quotation from this inquiry.';
        // Refresh the pipeline's inquiry list -- on a 409 the card is now stale.
        queryClient.invalidateQueries({ queryKey: ['inquiries'] });
        setError(message);
      });
  }, [inquiryId, router, queryClient]);

  return (
    <div>
      <PageHeader
        title="Preparing quotation…"
        subtitle="Creating a draft from the customer inquiry."
      />
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <Button className="mt-3" onClick={() => router.replace('/quotations')}>
            Back to pipeline
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-400">One moment…</p>
      )}
    </div>
  );
}
