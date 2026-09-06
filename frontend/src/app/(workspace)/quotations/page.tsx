'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragOverlay, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent 
} from '@dnd-kit/core';
import { quotationService } from '@/services/quotationService';
import { customerService } from '@/services/customerService';
import { inquiryService } from '@/services/inquiryService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { FilterBar, SearchInput, FilterSelect } from '@/components/ui/FilterBar';
import { statusLabel, statusTone } from '@/lib/statusMeta';
import { useSession } from '@/lib/hooks/useSession';
import type { Inquiry, Quotation, QuotationStatus } from '@/types';

const COLUMNS: { key: QuotationStatus; label: string }[] = [
  { key: 'Draft', label: 'Draft' },
  { key: 'PendingApproval', label: 'Pending Approval' },
  { key: 'Approved', label: 'Approved' },
  { key: 'UnderNegotiation', label: 'Negotiation' },
  { key: 'Confirmed', label: 'Confirmed' },
];

function total(q: Quotation) {
  return q.lines.reduce((sum, l) => sum + l.qty * l.unitPrice * (1 - l.discountPct / 100), 0);
}

export default function QuotationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const canCreateQuotation = user?.role !== 'Admin';
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [showNew, setShowNew] = useState(false);
  const [customerId, setCustomerId] = useState('');

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationService.list,
  });

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.list,
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ['inquiries'],
    queryFn: inquiryService.list,
  });

  const createMutation = useMutation({
    mutationFn: () => quotationService.create(customerId),
    onSuccess: (q) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      router.push(`/quotations/${q.id}`);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => quotationService.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotations.filter((quote) => {
      if (q && !quote.customerName.toLowerCase().includes(q) && !quote.id.toLowerCase().includes(q)) return false;
      if (tierFilter !== 'All' && quote.tier !== tierFilter) return false;
      if (statusFilter !== 'All' && quote.status !== statusFilter) return false;
      return true;
    });
  }, [quotations, search, tierFilter, statusFilter]);

  const rejectedOrReturned = filtered.filter((q) => q.status === 'Rejected' || q.status === 'Returned');
  const hasActiveFilters = search || tierFilter !== 'All' || statusFilter !== 'All';

  // Drag and Drop Logic
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    
    const quotationId = active.id as string;
    const fromStatus = active.data.current?.status as QuotationStatus;
    const toStatus = over.id as QuotationStatus;
    
    // Trigger submit-approval only if moved from Draft to PendingApproval
    if (fromStatus === 'Draft' && toStatus === 'PendingApproval') {
      submitMutation.mutate(quotationId);
    }
  };
  
  const activeQuotation = useMemo(() => {
    return quotations.find(q => q.id === activeId);
  }, [activeId, quotations]);

  return (
    <div>
      <PageHeader title="Quotations" subtitle="Every quotation in the system, one row per quotation, click a row to open it" />

      <div className="mb-6 flex flex-wrap gap-3">
        {canCreateQuotation && (
          <Button variant="primary" onClick={() => setShowNew((v) => !v)}>
            + New Quotation
          </Button>
        )}
        <Button onClick={() => setView((v) => (v === 'kanban' ? 'table' : 'kanban'))}>
          Switch to {view === 'kanban' ? 'Table' : 'Kanban'} View
        </Button>
      </div>

      {canCreateQuotation && showNew && (
        <Card className="mb-6 max-w-md">
          <div className="grid gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-600">Select Customer</span>
              <Select
                ariaLabel="Customer"
                value={customerId}
                onChange={setCustomerId}
                options={[
                  { value: '', label: 'Select a customer...' },
                  ...customers.map(c => ({ value: c.id, label: `${c.name} (${c.tier})` }))
                ]}
              />
            </div>
            <Button
              variant="primary"
              disabled={!customerId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create Draft
            </Button>
          </div>
        </Card>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or quotation ID…" />
        <FilterSelect
          ariaLabel="Filter by tier"
          value={tierFilter}
          onChange={setTierFilter}
          options={[
            { value: 'All', label: 'All tiers' },
            { value: 'Bronze', label: 'Bronze' },
            { value: 'Silver', label: 'Silver' },
            { value: 'Gold', label: 'Gold' },
          ]}
        />
        <FilterSelect
          ariaLabel="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'All', label: 'All statuses' }, ...(Object.keys(statusLabel) as QuotationStatus[]).map((s) => ({ value: s, label: statusLabel[s] }))]}
        />
      </FilterBar>

      {isLoading && <p className="text-slate-400">Loading quotations…</p>}

      {!isLoading && filtered.length === 0 && inquiries.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">
            {hasActiveFilters ? 'No quotations match these filters.' : 'No quotations yet.'}
          </p>
        </div>
      )}

      {(filtered.length > 0 || inquiries.length > 0) && view === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {inquiries.length > 0 && (
              <div className="w-64 shrink-0">
                <div className="mb-2 text-sm font-medium text-blue-600">
                  New Inquiry ({inquiries.length})
                </div>
                <div className="flex min-h-[120px] flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/40 p-2">
                  {inquiries.map((inq) => (
                    <InquiryCard
                      key={inq.id}
                      inquiry={inq}
                      onClick={() => router.push(`/quotations/new?fromInquiry=${inq.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.key} id={col.key} label={col.label}>
                {filtered
                  .filter((q) => q.status === col.key)
                  .map((q) => (
                    <DraggableCard 
                      key={q.id} 
                      quotation={q} 
                      onClick={() => router.push(`/quotations/${q.id}`)} 
                    />
                  ))}
              </KanbanColumn>
            ))}
            {rejectedOrReturned.length > 0 && (
              <KanbanColumn id="RejectedOrReturned" label="Rejected / Returned">
                {rejectedOrReturned.map((q) => (
                  <DraggableCard 
                    key={q.id} 
                    quotation={q} 
                    onClick={() => router.push(`/quotations/${q.id}`)} 
                  />
                ))}
              </KanbanColumn>
            )}
          </div>
          <DragOverlay>
            {activeQuotation ? (
              <div className="rounded-lg border border-blue-300 bg-white p-3 shadow-xl opacity-90 cursor-grabbing">
                <div className="text-sm font-medium text-slate-900">{activeQuotation.customerName}</div>
                <div className="text-xs text-slate-500">
                  ${total(activeQuotation).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {inquiries.length > 0 && view === 'table' && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-blue-700">New Inquiries</h2>
          <Table>
            <Thead>
              <Th>Received</Th>
              <Th>Customer</Th>
              <Th>Requested</Th>
              <Th>Note</Th>
              <Th>{''}</Th>
            </Thead>
            <Tbody>
              {inquiries.map((inq) => (
                <Tr
                  key={inq.id}
                  onClick={() => router.push(`/quotations/new?fromInquiry=${inq.id}`)}
                >
                  <Td>{new Date(inq.createdAt).toLocaleDateString()}</Td>
                  <Td className="font-medium text-slate-900">{inq.customerName}</Td>
                  <Td>{inq.items.reduce((n, i) => n + i.quantity, 0)} item(s)</Td>
                  <Td>{inq.note ?? '—'}</Td>
                  <Td className="text-blue-600">Build quotation →</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}

      {filtered.length > 0 && view === 'table' && (
        <Table>
          <Thead>
            <Th>Quotation</Th>
            <Th>Customer</Th>
            <Th>Tier</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
          </Thead>
          <Tbody>
            {filtered.map((q) => (
              <Tr key={q.id} onClick={() => router.push(`/quotations/${q.id}`)}>
                <Td className="font-medium text-slate-900">{q.id}</Td>
                <Td>{q.customerName}</Td>
                <Td>{q.tier}</Td>
                <Td>${total(q).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Td>
                <Td>
                  <Badge tone={statusTone[q.status]}>{statusLabel[q.status]}</Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}

function InquiryCard({ inquiry, onClick }: { inquiry: Inquiry; onClick: () => void }) {
  const itemCount = inquiry.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-blue-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="text-sm font-medium text-slate-900">{inquiry.customerName}</div>
      <div className="text-xs text-slate-500">
        {itemCount} item(s) · {new Date(inquiry.createdAt).toLocaleDateString()}
      </div>
      {inquiry.note && (
        <div className="mt-1 line-clamp-2 text-xs italic text-slate-400">“{inquiry.note}”</div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// DND Components
// ---------------------------------------------------------------------------

function KanbanColumn({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div className="w-64 shrink-0">
      <div className="mb-2 text-sm font-medium text-slate-500">{label}</div>
      <div 
        ref={setNodeRef} 
        className={`flex min-h-[120px] flex-col gap-2 rounded-xl border p-2 transition-colors ${
          isOver ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-slate-100/60'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function DraggableCard({ quotation, onClick }: { quotation: Quotation; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: quotation.id,
    data: { status: quotation.status },
  });

  if (isDragging) {
    return (
      <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 p-3 opacity-50 h-[68px]" />
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!e.defaultPrevented) onClick();
      }}
      className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      <div className="text-sm font-medium text-slate-900">{quotation.customerName}</div>
      <div className="text-xs text-slate-500">
        ${total(quotation).toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}
