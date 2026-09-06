'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '@/services/quotationService';
import { approvalService } from '@/services/approvalService';
import { useSession } from '@/lib/hooks/useSession';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/inputClass';
import { riskTone } from '@/lib/statusMeta';
import type { ApprovalRole } from '@/types';

const STAGES = ['Submitted', 'Sales Manager', 'Finance', 'Confirmed'] as const;

export default function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.get(id),
  });

  const decide = useMutation({
    mutationFn: ({ role, decision }: { role: ApprovalRole; decision: 'approved' | 'rejected' | 'returned' }) =>
      approvalService.decide(id, role, decision, reason, user?.name ?? 'You'),
    onSuccess: (q) => {
      queryClient.setQueryData(['quotation', id], q);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setReason('');
    },
  });

  if (isLoading || !quotation) return <p className="text-slate-400">Loading…</p>;

  const pendingStep = quotation.approvalSteps.find((s) => s.decision === 'pending');
  const canDecide =
    pendingStep &&
    ((pendingStep.role === 'SalesManager' && (user?.role === 'SalesManager' || user?.role === 'Admin')) ||
      (pendingStep.role === 'FinanceOps' && (user?.role === 'FinanceOps' || user?.role === 'Admin')));

  const currentStageIndex = (() => {
    if (quotation.status === 'Confirmed' || quotation.status === 'Approved') return 3;
    if (pendingStep?.role === 'FinanceOps') return 2;
    if (pendingStep?.role === 'SalesManager') return 1;
    return 0;
  })();

  return (
    <div>
      <PageHeader
        title={`Approval Detail: ${quotation.id} (${quotation.customerName})`}
        subtitle="Opened by clicking a row on the Approvals list"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone={riskTone[quotation.blendedRiskScore]}>Blended Risk: {quotation.blendedRiskScore}</Badge>
        <Badge tone="blue">Customer Tier: {quotation.tier}</Badge>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-blue-700">Why This Quote Was Flagged</h2>
      <Table>
        <Thead>
          <Th>Line</Th>
          <Th>Discount Given</Th>
          <Th>Limit Allowed</Th>
          <Th>Over By</Th>
        </Thead>
        <Tbody>
          {quotation.lines.map((l) => {
            const { ceiling, over } = quotationService.lineOverage(l);
            return (
              <Tr key={l.id}>
                <Td>
                  {l.productName} ({l.category})
                </Td>
                <Td>{l.discountPct}%</Td>
                <Td>{ceiling}%</Td>
                <Td className={over > 0 ? 'font-medium text-red-600' : 'text-emerald-600'}>
                  {over > 0 ? `${over}pt OVER` : 'Within limit'}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      <div className="mt-4">
        <Callout>
          Worst single line plus the overall pattern across the order sets the blended score. One bad line is
          enough to require approval.
        </Callout>
      </div>

      <div className="my-8 flex items-start">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex flex-1 items-start">
            <div className="flex w-14 shrink-0 flex-col items-center sm:w-20">
              <div
                className={`h-4 w-4 shrink-0 rounded-full ring-4 ${
                  i < currentStageIndex
                    ? 'bg-emerald-500 ring-emerald-100'
                    : i === currentStageIndex
                      ? 'bg-blue-600 ring-blue-100'
                      : 'bg-slate-300 ring-transparent'
                }`}
              />
              <span
                className={`mt-2 text-center text-[11px] leading-tight sm:text-xs ${
                  i <= currentStageIndex ? 'font-medium text-slate-700' : 'text-slate-400'
                }`}
              >
                {stage}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`mt-2 h-0.5 flex-1 ${i < currentStageIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-blue-700">Audit Trail</h2>
      <Table>
        <Thead>
          <Th>User</Th>
          <Th>Action</Th>
          <Th>Date</Th>
          <Th>Note</Th>
        </Thead>
        <Tbody>
          {quotation.auditTrail.map((a, i) => (
            <Tr key={i}>
              <Td>{a.user}</Td>
              <Td>{a.action}</Td>
              <Td>{a.date}</Td>
              <Td>{a.note ?? '—'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {canDecide && pendingStep && (
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-600">Reason / note (required for Reject or Return)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className={`mb-4 w-full text-sm ${inputClass}`}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="success"
              className="w-full sm:w-auto"
              onClick={() => decide.mutate({ role: pendingStep.role, decision: 'approved' })}
            >
              Approve
            </Button>
            <Button
              variant="warning"
              className="w-full sm:w-auto"
              disabled={!reason}
              onClick={() => decide.mutate({ role: pendingStep.role, decision: 'returned' })}
            >
              Return for Revision
            </Button>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              disabled={!reason}
              onClick={() => decide.mutate({ role: pendingStep.role, decision: 'rejected' })}
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      {!pendingStep && (
        <Button className="mt-6" onClick={() => router.push(`/quotations/${quotation.id}`)}>
          Back to Quotation
        </Button>
      )}
    </div>
  );
}
