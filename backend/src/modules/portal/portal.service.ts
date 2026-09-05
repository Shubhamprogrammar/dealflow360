import { ApiError } from '../../utils/api-error.js';
import { PRODUCT_CATEGORIES } from '../../types/domain.types.js';
import { CustomerModel } from '../customers/customer.model.js';
import { ProductModel } from '../products/product.model.js';
import { inquiryService } from '../inquiries/inquiry.service.js';
import type { InquiryView } from '../inquiries/inquiry.types.js';
import { QuotationModel } from '../quotations/quotation.model.js';
import type { CustomerComment, QuotationDocument } from '../quotations/quotation.model.js';
import type {
  PortalCatalogView,
  PortalQuotationView,
  RequestChangesInput,
  SubmitInquiryInput,
} from './portal.types.js';

// A quotation only becomes visible to the customer once it has cleared
// internal approval -- draft/pending_approval/rejected quotes don't exist as
// far as the portal is concerned, and a cross-customer lookup gets the same
// 404 rather than a 403, so neither leaks whether the record exists at all.
const VISIBLE_STATUSES = ['approved', 'sent_to_customer', 'under_negotiation', 'confirmed'];
const NEGOTIABLE_STATUSES = ['sent_to_customer', 'under_negotiation'];

// Deliberately excludes margin, blendedRiskScore, approvalRequired and
// currentApprovalStep -- roleaccess.md: Customer has "No access to margins,
// risk score, approvals."
const view = (
  quotation: QuotationDocument & { _id: { toString(): string } },
): PortalQuotationView => ({
  id: quotation._id.toString(),
  quoteNumber: quotation.quoteNumber,
  lineItems: quotation.lineItems.map((item) => ({
    id: item._id.toString(),
    product: item.product.toString(),
    variantId: item.variantId?.toString(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountPercent: item.discountPercent,
    lineTotal: item.lineTotal,
    isSubscription: item.isSubscription,
  })),
  subtotal: quotation.subtotal,
  totalDiscount: quotation.totalDiscount,
  tax: quotation.tax,
  grandTotal: quotation.grandTotal,
  status: quotation.status,
  customerNegotiation: {
    customerComments: quotation.customerNegotiation.customerComments.map((comment) => ({
      lineItemIndex: comment.lineItemIndex,
      comment: comment.comment,
      timestamp: comment.timestamp,
    })),
    counterDiscountProposal: quotation.customerNegotiation.counterDiscountProposal,
    repResponse: quotation.customerNegotiation.repResponse,
    lastModifiedBy: quotation.customerNegotiation.lastModifiedBy,
  },
  validUntil: quotation.validUntil,
});

const findVisible = async (
  id: string,
  customerId: string,
): Promise<ReturnType<typeof QuotationModel.hydrate>> => {
  const quotation = await QuotationModel.findById(id).exec();
  if (
    !quotation ||
    quotation.customer.toString() !== customerId ||
    !VISIBLE_STATUSES.includes(quotation.status)
  )
    throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
  return quotation;
};

export const portalService = {
  // Read-only catalog for the portal's "browse and send an inquiry" screen.
  // Indicative pricing only -- base price (plus variant adjustment); the rep
  // sets real pricing and discounts when the inquiry becomes a quotation.
  getCatalog: async (customerId: string): Promise<PortalCatalogView> => {
    const customer = await CustomerModel.findById(customerId).select('customerTier').exec();
    if (!customer) throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');

    const products = await ProductModel.find({ isActive: true }).sort({ name: 1 }).exec();

    const groups = PRODUCT_CATEGORIES.map((category) => ({
      category,
      products: products
        .filter((product) => product.category === category)
        .map((product) => ({
          id: product._id.toString(),
          name: product.name,
          category: product.category,
          unit: product.unit ?? 'Each',
          basePrice: product.basePrice,
          isSubscription: product.isSubscription,
          variants: product.variants.map((variant) => ({
            id: variant._id.toString(),
            attributeName: variant.attributeName,
            attributeValue: variant.attributeValue,
            priceAdjustment: variant.priceAdjustment,
          })),
        })),
    })).filter((group) => group.products.length > 0);

    return { customerTier: customer.customerTier, groups };
  },

  submitInquiry: async (
    customerId: string,
    input: SubmitInquiryInput,
  ): Promise<InquiryView> => inquiryService.create(customerId, input),

  listInquiries: async (customerId: string): Promise<InquiryView[]> =>
    inquiryService.listForCustomer(customerId),

  listQuotations: async (customerId: string): Promise<PortalQuotationView[]> => {
    const quotations = await QuotationModel.find({
      customer: customerId,
      status: { $in: VISIBLE_STATUSES }
    }).exec();
    return quotations.map(view);
  },

  getQuotation: async (id: string, customerId: string): Promise<PortalQuotationView> => {
    const quotation = await findVisible(id, customerId);
    if (quotation.status === 'approved') {
      quotation.status = 'sent_to_customer';
      await quotation.save();
    }
    return view(quotation);
  },

  requestChanges: async (
    id: string,
    customerId: string,
    input: RequestChangesInput,
  ): Promise<PortalQuotationView> => {
    const quotation = await findVisible(id, customerId);
    if (!NEGOTIABLE_STATUSES.includes(quotation.status))
      throw new ApiError(
        409,
        'This quotation is not open for negotiation',
        'QUOTATION_NOT_NEGOTIABLE',
      );

    for (const comment of input.comments ?? []) {
      if (comment.lineItemIndex >= quotation.lineItems.length)
        throw new ApiError(
          422,
          `lineItemIndex ${comment.lineItemIndex} is out of range`,
          'INVALID_LINE_ITEM_INDEX',
        );
      quotation.customerNegotiation.customerComments.push({
        lineItemIndex: comment.lineItemIndex,
        comment: comment.comment,
        timestamp: new Date(),
      } as CustomerComment);
    }
    if (input.counterDiscountProposal !== undefined)
      quotation.customerNegotiation.counterDiscountProposal = input.counterDiscountProposal;
    quotation.customerNegotiation.lastModifiedBy = 'customer';
    quotation.status = 'under_negotiation';

    await quotation.save();
    return view(quotation);
  },

  confirm: async (id: string, customerId: string): Promise<PortalQuotationView> => {
    const quotation = await findVisible(id, customerId);
    if (!NEGOTIABLE_STATUSES.includes(quotation.status))
      throw new ApiError(
        409,
        'This quotation cannot be confirmed in its current state',
        'QUOTATION_NOT_CONFIRMABLE',
      );

    quotation.status = 'confirmed';
    quotation.customerNegotiation.lastModifiedBy = 'customer';
    await quotation.save();
    return view(quotation);
  },
};
