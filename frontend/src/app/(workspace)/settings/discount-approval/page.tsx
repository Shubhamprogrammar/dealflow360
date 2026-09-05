'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { inputClassSm } from '@/components/ui/inputClass';
import type { DiscountConfig } from '@/types';

export default function DiscountApprovalSetupPage() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['discountConfig'], queryFn: settingsService.getDiscountConfig });
  const [config, setConfig] = useState<DiscountConfig | null>(null);
  const [seeded, setSeeded] = useState(false);

  if (data && !seeded) {
    setSeeded(true);
    setConfig(data);
  }

  const save = useMutation({
    mutationFn: () => settingsService.saveDiscountConfig(config!),
  });

  if (!config) return <p className="px-6 py-8 text-slate-400">Loading…</p>;

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            DealFlow<span className="text-blue-600">360</span>
          </span>
          <button onClick={() => router.back()} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <PageHeader title="Discount tiers and approval chains" subtitle="Admin configuration — governs every quotation's blended risk score" />

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-medium text-slate-500">Tier Discount Ceilings</h2>
            <Table>
              <Thead>
                <Th>Tier</Th>
                <Th>Max Discount</Th>
              </Thead>
              <Tbody>
                {config.tierCeilings.map((t, i) => (
                  <Tr key={t.tier}>
                    <Td className="font-medium text-slate-900">{t.tier}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={t.maxDiscountPct}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              tierCeilings: config.tierCeilings.map((x, idx) =>
                                idx === i ? { ...x, maxDiscountPct: Number(e.target.value) } : x,
                              ),
                            })
                          }
                          className={`w-20 ${inputClassSm}`}
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-slate-500">Category Discount ceilings</h2>
            <Table>
              <Thead>
                <Th>Category</Th>
                <Th>Max Discount</Th>
              </Thead>
              <Tbody>
                {config.categoryCeilings.map((c, i) => (
                  <Tr key={c.category}>
                    <Td className="font-medium text-slate-900">{c.category}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={c.maxDiscountPct}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              categoryCeilings: config.categoryCeilings.map((x, idx) =>
                                idx === i ? { ...x, maxDiscountPct: Number(e.target.value) } : x,
                              ),
                            })
                          }
                          className={`w-20 ${inputClassSm}`}
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </div>

        <h2 className="mt-6 mb-3 text-sm font-medium text-slate-500">Approval Routing by Blended Risk</h2>
        <Table>
          <Thead>
            <Th>Discount range</Th>
            <Th>Approver</Th>
          </Thead>
          <Tbody>
            <Tr>
              <Td>Within every line&apos;s tier/category limit</Td>
              <Td className="text-emerald-600">No approval needed</Td>
            </Tr>
            <Tr>
              <Td>Over limit, blended risk medium</Td>
              <Td>Sales Manager</Td>
            </Tr>
            <Tr>
              <Td>Over limit, blended risk high</Td>
              <Td>Sales Manager, then Finance</Td>
            </Tr>
          </Tbody>
        </Table>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => save.mutate()} disabled={save.isPending}>
            Save configuration
          </Button>
          <Button onClick={() => router.back()}>Back</Button>
        </div>

        <div className="mt-6">
          <Callout>
            When a quote mixes categories with different ceilings, the system computes a blended risk score per
            line and routes to the highest required level. All approvals, rejections, and edits are logged with
            user, timestamp, and reason.
          </Callout>
        </div>
      </div>
    </div>
  );
}
