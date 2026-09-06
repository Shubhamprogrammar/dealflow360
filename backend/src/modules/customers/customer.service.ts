import type { FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { buildPagination, toSkip, type Pagination } from '../../utils/pagination.js';
import { UserModel } from '../users/user.model.js';
import { CustomerModel, type CustomerDocument } from './customer.model.js';
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from './customer.types.js';

const notFound = (): ApiError => new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');

const findOrThrow = async (id: string): Promise<CustomerDocument & { save: () => unknown }> => {
  const customer = await CustomerModel.findById(id).exec();
  if (!customer) throw notFound();
  return customer;
};

// Portal login and magic links resolve a customer by contactEmail, so a duplicate would make
// that lookup ambiguous.
const assertEmailAvailable = async (contactEmail: string, excludeId?: string): Promise<void> => {
  const filter: FilterQuery<CustomerDocument> = { contactEmail: contactEmail.toLowerCase() };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await CustomerModel.exists(filter).exec())
    throw new ApiError(409, 'A customer with this contact email already exists', 'CUSTOMER_EXISTS');
};

const assertRepExists = async (assignedRep: string): Promise<void> => {
  const rep = await UserModel.findById(assignedRep).select('role isActive').exec();
  if (!rep) throw new ApiError(422, 'Assigned rep does not exist', 'UNKNOWN_REP');
  if (rep.role !== 'sales_rep')
    throw new ApiError(422, 'Assigned user is not a sales rep', 'INVALID_REP_ROLE');
  if (!rep.isActive) throw new ApiError(422, 'Assigned rep is deactivated', 'INACTIVE_REP');
};

export const customerService = {
  create: async (input: CreateCustomerInput): Promise<CustomerDocument> => {
    await assertEmailAvailable(input.contactEmail);
    if (input.assignedRep) await assertRepExists(input.assignedRep);
    return CustomerModel.create(input);
  },

  list: async (
    query: ListCustomersQuery,
  ): Promise<{ customers: CustomerDocument[]; pagination: Pagination }> => {
    const filter: FilterQuery<CustomerDocument> = {};
    if (query.customerTier) filter.customerTier = query.customerTier;
    if (query.assignedRep) filter.assignedRep = query.assignedRep;
    const [customers, total] = await Promise.all([
      CustomerModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .populate('assignedRep', 'firstName lastName email role')
        .exec(),
      CustomerModel.countDocuments(filter).exec(),
    ]);
    return { customers, pagination: buildPagination(query, total) };
  },

  getById: async (id: string): Promise<CustomerDocument> => {
    const customer = await CustomerModel.findById(id)
      .populate('assignedRep', 'firstName lastName email role')
      .exec();
    if (!customer) throw notFound();
    return customer;
  },

  update: async (id: string, input: UpdateCustomerInput): Promise<CustomerDocument> => {
    const customer = await findOrThrow(id);
    if (input.contactEmail) await assertEmailAvailable(input.contactEmail, id);
    if (input.assignedRep) await assertRepExists(input.assignedRep);
    Object.assign(customer, input);
    await customer.save();
    return customer;
  },

  assignRep: async (id: string, assignedRep: string): Promise<CustomerDocument> => {
    await assertRepExists(assignedRep);
    const customer = await findOrThrow(id);
    customer.assignedRep = assignedRep as never;
    await customer.save();
    return customer;
  },
};
