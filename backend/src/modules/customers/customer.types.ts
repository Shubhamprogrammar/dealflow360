import type { CustomerTier } from '../../types/domain.types.js';
import type { PaginationQuery } from '../../utils/pagination.js';

export type CreateCustomerInput = {
  companyName: string;
  contactEmail: string;
  contactName?: string;
  customerTier?: CustomerTier;
  creditScore?: number;
  paymentTerms?: string;
  assignedRep?: string;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type ListCustomersQuery = PaginationQuery & {
  customerTier?: CustomerTier;
  assignedRep?: string;
};
