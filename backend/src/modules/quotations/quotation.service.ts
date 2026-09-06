import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import type { Role } from '../../types/common.types.js';
import type { RiskLevel } from '../../types/domain.types.js';
import { CustomerModel } from '../customers/customer.model.js';
import { ProductModel } from '../products/product.model.js';
import { DiscountTierModel } from '../discount-tiers/discount-tier.model.js';
import { UpsellRuleModel } from '../upsell-rules/upsell-rule.model.js';
import { QuotationModel } from './quotation.model.js';
import type { QuotationDocument, QuotationLineItem, RiskViolation } from './quotation.model.js';
import type {
  AddLineItemInput,
  CreateQuotationInput,
  ListQuotationsQuery,
  Pagination,
  QuotationView,
  UpdateLineItemInput,
  UpdateQuotationInput,
  UpsellSuggestionView,
} from './quotation.types.js';

type Requester = { id: string; role: Role };

const DUPLICATE_KEY_ERROR_CODE = 11000;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: number }).code === DUPLICATE_KEY_ERROR_CODE;

const generateQuoteNumber = (): string =>
  `Q-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const view = (quotation: any): QuotationView => ({
  id: quotation._id.toString(),
  quoteNumber: quotation.quoteNumber,
  customer: quotation.customer._id ? quotation.customer._id.toString() : quotation.customer.toString(),
  customerName: quotation.customer.companyName || 'Unknown Customer',
  customerTier: quotation.customer.customerTier || 'bronze',
  createdBy: quotation.createdBy._id ? quotation.createdBy._id.toString() : quotation.createdBy.toString(),
  lineItems: quotation.lineItems.map((item: any) => ({
    id: item._id.toString(),
    product: item.product._id ? item.product._id.toString() : item.product.toString(),
    productName: item.product.name || 'Unknown Product',
    productCategory: item.product.category || 'hardware',
    variantId: item.variantId?.toString(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountPercent: item.discountPercent,
    lineTotal: item.lineTotal,
    margin: item.margin,
    isSubscription: item.isSubscription,
    subscriptionPlan: item.subscriptionPlan?.toString(),
  })),
  subtotal: quotation.subtotal,
  totalDiscount: quotation.totalDiscount,
  tax: quotation.tax,
  grandTotal: quotation.grandTotal,
  blendedRiskScore: quotation.blendedRiskScore,
  status: quotation.status,
  approvalRequired: quotation.approvalRequired,
  currentApprovalStep: quotation.currentApprovalStep,
  validUntil: quotation.validUntil,
  version: quotation.version,
  createdAt: quotation.createdAt,
  updatedAt: quotation.updatedAt,
});

const PRIVILEGED_ROLES: Role[] = ['admin', 'sales_manager'];

const findOwned = async (
  id: string,
  requester: Requester,
): Promise<any> => {
  const quotation = await QuotationModel.findById(id).populate('customer').populate('lineItems.product').exec();
  if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
  const isOwner = quotation.createdBy.toString() === requester.id;
  if (!isOwner && !PRIVILEGED_ROLES.includes(requester.role))
    throw new ApiError(403, 'You do not have access to this quotation', 'FORBIDDEN');
  return quotation;
};

const assertDraft = (quotation: QuotationDocument): void => {
  if (quotation.status !== 'draft')
    throw new ApiError(409, 'Only draft quotations can be modified', 'QUOTATION_NOT_DRAFT');
};

// Exported for approval.service.ts's respondToNegotiation, which applies its
// own line-item edits (rep countering a customer's negotiation) and needs
// the same totals recompute without duplicating the math.
export const recalculateTotals = async (quotation: QuotationDocument): Promise<void> => {
  const productIds = [...new Set(quotation.lineItems.map((item) => {
    const p = item.product as any;
    return (p._id ? p._id : p).toString();
  }))];
  const products = await ProductModel.find({ _id: { $in: productIds } })
    .select('taxRate')
    .exec();
  const taxRateByProduct = new Map(
    products.map((product) => [product._id.toString(), product.taxRate]),
  );

  let subtotal = 0;
  let lineTotalSum = 0;
  let tax = 0;

  for (const item of quotation.lineItems) {
    subtotal += item.quantity * item.unitPrice;
    lineTotalSum += item.lineTotal;
    const p = item.product as any;
    const productId = (p._id ? p._id : p).toString();
    tax += item.lineTotal * (taxRateByProduct.get(productId) ?? 0);
  }

  quotation.subtotal = subtotal;
  quotation.totalDiscount = subtotal - lineTotalSum;
  quotation.tax = tax;
  quotation.grandTotal = lineTotalSum + tax;
};

const findLineItemIndex = (quotation: QuotationDocument, itemId: string): number => {
  const index = quotation.lineItems.findIndex((lineItem) => lineItem._id.toString() === itemId);
  if (index === -1) throw new ApiError(404, 'Line item not found', 'LINE_ITEM_NOT_FOUND');
  return index;
};

// Shared with approval.service.ts (submit-approval needs the same tier ->
// approvalChain lookup this uses for categorySpecificLimits) so both stay in
// sync on the "no discount tier configured" error instead of duplicating it.
export const getDiscountTierForCustomer = async (
  customerId: Types.ObjectId | string,
): Promise<ReturnType<typeof DiscountTierModel.hydrate>> => {
  const customer = await CustomerModel.findById(customerId).select('customerTier').exec();
  if (!customer) throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');

  const discountTier = await DiscountTierModel.findOne({ tierName: customer.customerTier }).exec();
  if (!discountTier)
    throw new ApiError(
      404,
      `No discount tier configured for customer tier "${customer.customerTier}"`,
      'DISCOUNT_TIER_NOT_FOUND',
    );
  return discountTier;
};

// Exported for approval.service.ts's respondToNegotiation -- same reasoning
// as recalculateTotals above.
export const calculateBlendedRisk = async (
  quotation: QuotationDocument,
): Promise<{ score: number; level: RiskLevel; violations: RiskViolation[] }> => {
  const discountTier = await getDiscountTierForCustomer(quotation.customer);

  const productIds = [...new Set(quotation.lineItems.map((item) => {
    const p = item.product as any;
    return (p._id ? p._id : p).toString();
  }))];
  const products = await ProductModel.find({ _id: { $in: productIds } })
    .select('category')
    .exec();
  const categoryByProduct = new Map(
    products.map((product) => [product._id.toString(), product.category]),
  );

  const violations: RiskViolation[] = [];
  for (const item of quotation.lineItems) {
    const p = item.product as any;
    const productId = (p._id ? p._id : p).toString();
    const category = categoryByProduct.get(productId);
    if (!category) continue;
    const categoryLimit = discountTier.categorySpecificLimits.find(
      (limit) => limit.category === category,
    );
    const allowedDiscount = categoryLimit?.maxDiscount ?? discountTier.maxDiscountPercent;
    if (item.discountPercent > allowedDiscount) {
      violations.push({
        lineItem: item._id,
        category,
        discountGiven: item.discountPercent,
        discountAllowed: allowedDiscount,
        overagePoints: item.discountPercent - allowedDiscount,
      } as RiskViolation);
    }
  }

  const score = violations.reduce((sum, violation) => sum + violation.overagePoints, 0);
  // Formula per the architecture doc's code snippet. Note: the doc's own
  // worked example (18% discount vs a 10% limit -> claimed "medium") does not
  // match this formula on a single line item (8 overage points is "low"
  // here) -- implemented literally per the documented formula, not the prose
  // example, per product decision.
  const level: RiskLevel = score > 20 ? 'high' : score > 10 ? 'medium' : 'low';

  return { score, level, violations };
};

export const quotationService = {
  create: async (input: CreateQuotationInput, requester: Requester): Promise<QuotationView> => {
    const customer = await CustomerModel.findById(input.customer).exec();
    if (!customer) throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const quotation = await QuotationModel.create({
          quoteNumber: generateQuoteNumber(),
          customer: customer._id,
          createdBy: requester.id,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        });
        await quotation.populate('customer');
        return view(quotation);
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }
    }
    throw new ApiError(500, 'Failed to generate a unique quote number', 'QUOTE_NUMBER_CONFLICT');
  },

  // roleaccess.md scoping: Sales Rep sees only their own deals; Finance/Ops
  // is restricted to approved quotations; Manager (team-level) and Admin see
  // everything matching the requested filters.
  list: async (
    query: ListQuotationsQuery,
    requester: Requester,
  ): Promise<{ items: QuotationView[]; pagination: Pagination }> => {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.customer) filter.customer = query.customer;
    if (requester.role === 'sales_rep') filter.createdBy = requester.id;
    if (requester.role === 'finance') filter.status = 'approved';

    const [items, total] = await Promise.all([
      QuotationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate('customer')
        .populate('lineItems.product')
        .exec(),
      QuotationModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map(view),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },

  getById: async (id: string, requester: Requester): Promise<QuotationView> => {
    const quotation = await QuotationModel.findById(id).populate('customer').populate('lineItems.product').exec();
    if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
    if (requester.role === 'sales_rep' && quotation.createdBy.toString() !== requester.id)
      throw new ApiError(403, 'You do not have access to this quotation', 'FORBIDDEN');
    if (requester.role === 'finance' && !['approved', 'pending_approval', 'under_negotiation'].includes(quotation.status))
      throw new ApiError(403, 'Finance can only view submitted or approved quotations', 'FORBIDDEN');
    return view(quotation);
  },

  update: async (
    id: string,
    input: UpdateQuotationInput,
    requester: Requester,
  ): Promise<QuotationView> => {
    const quotation = await findOwned(id, requester);
    assertDraft(quotation);
    if (input.validUntil !== undefined) quotation.validUntil = new Date(input.validUntil);
    await quotation.save();
    return view(quotation);
  },

  remove: async (id: string, requester: Requester): Promise<void> => {
    const quotation = await findOwned(id, requester);
    assertDraft(quotation);
    await quotation.deleteOne();
  },

  addLineItem: async (
    id: string,
    input: AddLineItemInput,
    requester: Requester,
  ): Promise<QuotationView> => {
    const quotation = await findOwned(id, requester);
    assertDraft(quotation);

    const product = await ProductModel.findById(input.product).exec();
    if (!product || !product.isActive)
      throw new ApiError(404, 'Product not found or inactive', 'PRODUCT_NOT_FOUND');

    let priceAdjustment = 0;
    if (input.variantId) {
      const variant = product.variants.find(
        (candidate) => candidate._id.toString() === input.variantId,
      );
      if (!variant) throw new ApiError(404, 'Product variant not found', 'VARIANT_NOT_FOUND');
      priceAdjustment = variant.priceAdjustment;
    }

    const discountPercent = input.discountPercent ?? 0;
    const unitPrice = product.basePrice + priceAdjustment;
    const lineTotal = input.quantity * unitPrice * (1 - discountPercent / 100);
    const margin = lineTotal - input.quantity * product.costPrice;

    quotation.lineItems.push({
      product: product._id,
      variantId: input.variantId ? new Types.ObjectId(input.variantId) : undefined,
      quantity: input.quantity,
      unitPrice,
      discountPercent,
      lineTotal,
      margin,
      isSubscription: product.isSubscription,
    } as QuotationLineItem);

    await recalculateTotals(quotation);
    await quotation.save();
    return view(quotation);
  },

  updateLineItem: async (
    id: string,
    itemId: string,
    input: UpdateLineItemInput,
    requester: Requester,
  ): Promise<QuotationView> => {
    const quotation = await findOwned(id, requester);
    assertDraft(quotation);

    const index = findLineItemIndex(quotation, itemId);
    const item = quotation.lineItems[index] as QuotationLineItem;
    const product = await ProductModel.findById(item.product).select('costPrice').exec();
    if (!product) throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');

    if (input.quantity !== undefined) item.quantity = input.quantity;
    if (input.discountPercent !== undefined) item.discountPercent = input.discountPercent;
    item.lineTotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
    item.margin = item.lineTotal - item.quantity * product.costPrice;

    await recalculateTotals(quotation);
    await quotation.save();
    return view(quotation);
  },

  removeLineItem: async (
    id: string,
    itemId: string,
    requester: Requester,
  ): Promise<QuotationView> => {
    const quotation = await findOwned(id, requester);
    assertDraft(quotation);

    const index = findLineItemIndex(quotation, itemId);
    quotation.lineItems.splice(index, 1);

    await recalculateTotals(quotation);
    await quotation.save();
    return view(quotation);
  },

  calculateRisk: async (id: string, requester: Requester): Promise<QuotationView> => {
    const quotation = await findOwned(id, requester);
    assertDraft(quotation);

    const { score, level, violations } = await calculateBlendedRisk(quotation);
    quotation.blendedRiskScore = { score, level, violations };
    quotation.approvalRequired = violations.length > 0;

    await quotation.save();
    return view(quotation);
  },

  // Read-only, same visibility rules as getById -- reused rather than
  // duplicated. Margin is basePrice - costPrice (per-unit, absolute): the
  // Product schema has no stored `margin` field, so the architecture doc's
  // `product.margin` snippet doesn't map to a real field -- see the B4 plan
  // notes for this default.
  getUpsellSuggestions: async (
    id: string,
    requester: Requester,
  ): Promise<UpsellSuggestionView[]> => {
    const quotation = await quotationService.getById(id, requester);
    const cartProductIds = quotation.lineItems.map((item) => item.product);
    if (cartProductIds.length === 0) return [];

    const rules = await UpsellRuleModel.find({
      primaryProduct: { $in: cartProductIds },
    }).exec();

    const candidates = rules
      .flatMap((rule) => rule.suggestedProducts)
      .filter((suggestion) => !cartProductIds.includes(suggestion.product.toString()));
    if (candidates.length === 0) return [];

    const productIds = [...new Set(candidates.map((candidate) => candidate.product.toString()))];
    const products = await ProductModel.find({ _id: { $in: productIds }, isActive: true }).exec();
    const productById = new Map(products.map((product) => [product._id.toString(), product]));

    const bestByProduct = new Map<string, UpsellSuggestionView>();
    for (const candidate of candidates) {
      const productId = candidate.product.toString();
      const product = productById.get(productId);
      if (!product) continue;

      const margin = product.basePrice - product.costPrice;
      if (margin < candidate.minMarginThreshold) continue;

      const existing = bestByProduct.get(productId);
      const isBetter =
        !existing ||
        (candidate.isPromoted && !existing.isPromoted) ||
        (candidate.isPromoted === existing.isPromoted &&
          candidate.coOccurrenceScore > existing.coOccurrenceScore);
      if (isBetter)
        bestByProduct.set(productId, {
          product: {
            id: product._id.toString(),
            name: product.name,
            category: product.category,
            basePrice: product.basePrice,
          },
          coOccurrenceScore: candidate.coOccurrenceScore,
          isPromoted: candidate.isPromoted,
          margin,
        });
    }

    return [...bestByProduct.values()].sort((a, b) => {
      if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
      return b.coOccurrenceScore - a.coOccurrenceScore;
    });
  },
};
