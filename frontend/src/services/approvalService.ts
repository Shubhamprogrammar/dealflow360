import { api } from '@/lib/api/apiClient';
import { mapQuotation } from '@/lib/mapper/mappers';
import type { ApprovalDecision, ApprovalRole, Quotation } from '@/types';

export const approvalService = {
  queue: async (): Promise<Quotation[]> => {
    const res = await api.get<any>('/approvals/queue');
    return res.data.map(mapQuotation);
  },
  decide: async (id: string, role: ApprovalRole, decision: ApprovalDecision, reason: string, by: string): Promise<Quotation> => {
    if (decision === 'approved') {
      await api.post<any>(`/approvals/${id}/approve`, { reason });
    } else if (decision === 'rejected') {
      await api.post<any>(`/approvals/${id}/reject`, { reason });
    } else if (decision === 'returned') {
      await api.post<any>(`/approvals/${id}/request-revision`, { reason });
    }
    
    // Fetch and return the updated quotation
    const res = await api.get<any>(`/quotations/${id}`);
    return mapQuotation(res.data);
  },
};
