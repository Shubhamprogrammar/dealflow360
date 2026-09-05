import type { QuotationStatus } from '@/types';

export const statusTone: Record<QuotationStatus, 'neutral' | 'blue' | 'green' | 'amber' | 'red'> = {
  Draft: 'neutral',
  PendingApproval: 'amber',
  Approved: 'green',
  Rejected: 'red',
  Returned: 'amber',
  UnderNegotiation: 'blue',
  Confirmed: 'green',
};

export const statusLabel: Record<QuotationStatus, string> = {
  Draft: 'Draft',
  PendingApproval: 'Pending Approval',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Returned: 'Returned',
  UnderNegotiation: 'Under Negotiation',
  Confirmed: 'Confirmed',
};

export const riskTone: Record<'LOW' | 'MEDIUM' | 'HIGH', 'green' | 'amber' | 'red'> = {
  LOW: 'green',
  MEDIUM: 'amber',
  HIGH: 'red',
};
