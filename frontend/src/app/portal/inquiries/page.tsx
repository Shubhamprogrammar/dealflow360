'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { portalCatalogService } from '@/services/portalCatalogService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import type { InquiryStatus } from '@/types';

const STATUS_LABEL: Record<InquiryStatus, string> = {
  New: 'Sent — awaiting review',
  InReview: 'In review',
  Converted: 'Quotation prepared',
  Dismissed: 'Closed',
};

const STATUS_TONE: Record<InquiryStatus, 'blue' | 'amber' | 'green' | 'neutral'> = {
  New: 'blue',
  InReview: 'amber',
  Converted: 'green',
  Dismissed: 'neutral',
};

export default function PortalInquiriesPage() {
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['portal-inquiries'],
    queryFn: portalCatalogService.listMyInquiries,
  });

  if (isLoading) return <p className="p-8 text-slate-400">Loading…</p>;

  return (
    <div>
      <PageHeader title="My Inquiries" subtitle="Requests you've sent to the sales team." />

      {inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">You haven&apos;t sent any inquiries yet.</p>
          <Link href="/portal/catalog">
            <Button variant="primary" className="mt-4">
              Browse the catalog
            </Button>
          </Link>
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Sent</Th>
            <Th>Items</Th>
            <Th>Note</Th>
            <Th>Status</Th>
          </Thead>
          <Tbody>
            {inquiries.map((inq) => (
              <Tr key={inq.id}>
                <Td>{new Date(inq.createdAt).toLocaleDateString()}</Td>
                <Td className="text-slate-900">
                  {inq.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                </Td>
                <Td>{inq.note ?? '—'}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[inq.status]}>{STATUS_LABEL[inq.status]}</Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
