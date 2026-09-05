import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { buildPagination, toSkip, type Pagination } from '../../utils/pagination.js';
import type { InquiryStatus } from '../../types/domain.types.js';
import { CustomerModel } from '../customers/customer.model.js';
import { ProductModel } from '../products/product.model.js';
import { InquiryModel, type InquiryDocument } from './inquiry.model.js';
import type { CreateInquiryInput, InquiryView, ListInquiriesQuery } from './inquiry.types.js';

// Statuses a rep is allowed to turn into a quotation. Once an inquiry is
// `converted` it is owned by the quotation; `dismissed` is a dead end.
const CONVERTIBLE_STATUSES: InquiryStatus[] = ['new', 'in_review'];

const view = (inquiry: any): InquiryView => ({
  id: inquiry._id.toString(),
  customer: inquiry.customer?._id ? inquiry.customer._id.toString() : inquiry.customer.toString(),
  customerName: inquiry.customer?.companyName ?? 'Unknown Customer',
  customerTier: inquiry.customer?.customerTier ?? 'bronze',
  items: inquiry.items.map((item: any) => ({
    id: item._id.toString(),
    product: item.product?._id ? item.product._id.toString() : item.product.toString(),
    productName: item.product?.name ?? 'Unknown Product',
    productCategory: item.product?.category ?? 'hardware',
    variantId: item.variantId?.toString(),
    quantity: item.quantity,
    unitPriceSnapshot: item.unitPriceSnapshot,
    note: item.note,
  })),
  note: inquiry.note,
  status: inquiry.status,
  convertedQuotation: inquiry.convertedQuotation?.toString(),
  reviewedBy: inquiry.reviewedBy?.toString(),
  createdAt: inquiry.createdAt,
  updatedAt: inquiry.updatedAt,
});

const populated = (id: string) =>
  InquiryModel.findById(id).populate('customer').populate('items.product').exec();

export const inquiryService = {
  create: async (customerId: string, input: CreateInquiryInput): Promise<InquiryView> => {
    const customer = await CustomerModel.findById(customerId).exec();
    if (!customer) throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');

    const productIds = [...new Set(input.items.map((item) => item.product))];
    const products = await ProductModel.find({ _id: { $in: productIds }, isActive: true }).exec();
    const productById = new Map(products.map((product) => [product._id.toString(), product]));

    const items = input.items.map((item) => {
      const product = productById.get(item.product);
      if (!product)
        throw new ApiError(404, `Product ${item.product} not found or inactive`, 'PRODUCT_NOT_FOUND');

      let priceAdjustment = 0;
      if (item.variantId) {
        const variant = product.variants.find(
          (candidate) => candidate._id.toString() === item.variantId,
        );
        if (!variant) throw new ApiError(404, 'Product variant not found', 'VARIANT_NOT_FOUND');
        priceAdjustment = variant.priceAdjustment;
      }

      return {
        product: product._id,
        variantId: item.variantId ? new Types.ObjectId(item.variantId) : undefined,
        quantity: item.quantity,
        unitPriceSnapshot: product.basePrice + priceAdjustment,
        note: item.note,
      };
    });

    const inquiry = await InquiryModel.create({
      customer: customer._id,
      items,
      note: input.note,
      status: 'new',
    });
    return view(await populated(inquiry._id.toString()));
  },

  // Decision: all reps see all inquiries -- no assignedRep scoping.
  listForStaff: async (
    query: ListInquiriesQuery,
  ): Promise<{ items: InquiryView[]; pagination: Pagination }> => {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    const [inquiries, total] = await Promise.all([
      InquiryModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .populate('customer')
        .populate('items.product')
        .exec(),
      InquiryModel.countDocuments(filter).exec(),
    ]);

    return { items: inquiries.map(view), pagination: buildPagination(query, total) };
  },

  getById: async (id: string): Promise<InquiryView> => {
    const inquiry = await populated(id);
    if (!inquiry) throw new ApiError(404, 'Inquiry not found', 'INQUIRY_NOT_FOUND');
    return view(inquiry);
  },

  listForCustomer: async (customerId: string): Promise<InquiryView[]> => {
    const inquiries = await InquiryModel.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate('items.product')
      .exec();
    return inquiries.map(view);
  },

  dismiss: async (id: string, userId: string): Promise<InquiryView> => {
    const inquiry = await InquiryModel.findById(id).exec();
    if (!inquiry) throw new ApiError(404, 'Inquiry not found', 'INQUIRY_NOT_FOUND');
    if (!CONVERTIBLE_STATUSES.includes(inquiry.status))
      throw new ApiError(409, `Inquiry is already ${inquiry.status}`, 'INQUIRY_NOT_OPEN');
    inquiry.status = 'dismissed';
    inquiry.reviewedBy = new Types.ObjectId(userId);
    await inquiry.save();
    return view(await populated(id));
  },

  // Atomically claims an open inquiry for conversion. The status filter makes
  // this a compare-and-set: if another rep already converted it (or it was
  // dismissed) the update matches nothing and we throw 409 -- no read-then-check
  // window for two reps to both pass. Returns the pre-image so the caller knows
  // the prior status to restore if the conversion then fails.
  markConverting: async (id: string): Promise<InquiryDocument & { _id: Types.ObjectId }> => {
    const previous = await InquiryModel.findOneAndUpdate(
      { _id: id, status: { $in: CONVERTIBLE_STATUSES } },
      { $set: { status: 'converted' } },
      { new: false },
    ).exec();
    if (!previous) {
      // Distinguish "doesn't exist" from "already taken" for a clearer message.
      const exists = await InquiryModel.exists({ _id: id }).exec();
      if (!exists) throw new ApiError(404, 'Inquiry not found', 'INQUIRY_NOT_FOUND');
      throw new ApiError(
        409,
        'This inquiry has already been converted or dismissed.',
        'INQUIRY_ALREADY_CONVERTED',
      );
    }
    return previous as InquiryDocument & { _id: Types.ObjectId };
  },

  // Called once the quotation exists: record the link and who converted it.
  finalizeConversion: async (
    id: string,
    quotationId: string,
    userId: string,
  ): Promise<void> => {
    await InquiryModel.updateOne(
      { _id: id },
      {
        $set: {
          convertedQuotation: new Types.ObjectId(quotationId),
          reviewedBy: new Types.ObjectId(userId),
        },
      },
    ).exec();
  },

  // Undo markConverting when the conversion fails before a quotation is created
  // (e.g. a requested product went inactive). Guarded so it can never clobber a
  // conversion that actually succeeded: only an inquiry still marked 'converted'
  // with no quotation attached is released, and it goes back to its prior status.
  releaseConversion: async (id: string, priorStatus: InquiryStatus): Promise<void> => {
    await InquiryModel.updateOne(
      { _id: id, status: 'converted', convertedQuotation: { $exists: false } },
      { $set: { status: priorStatus } },
    ).exec();
  },
};
