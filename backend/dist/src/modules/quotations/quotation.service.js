import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { CustomerModel } from '../customers/customer.model.js';
import { ProductModel } from '../products/product.model.js';
import { DiscountTierModel } from '../discount-tiers/discount-tier.model.js';
import { QuotationModel } from './quotation.model.js';
const DUPLICATE_KEY_ERROR_CODE = 11000;
const isDuplicateKeyError = (error) => typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === DUPLICATE_KEY_ERROR_CODE;
const generateQuoteNumber = () => `Q-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
const view = (quotation) => ({
    id: quotation._id.toString(),
    quoteNumber: quotation.quoteNumber,
    customer: quotation.customer.toString(),
    createdBy: quotation.createdBy.toString(),
    lineItems: quotation.lineItems.map((item) => ({
        id: item._id.toString(),
        product: item.product.toString(),
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
// roleaccess.md: Rep permissions are "create & edit quotations" (their own —
// pipeline access is scoped to "own deals only"); Manager's own permissions
// list is approve/reject/comment/escalate, not editing a rep's draft. So
// mutation stays owner-only regardless of role — the route-level `authorize`
// in quotation.routes.ts already restricts who can reach these at all.
const findOwned = async (id, requester) => {
    const quotation = await QuotationModel.findById(id).exec();
    if (!quotation)
        throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
    if (quotation.createdBy.toString() !== requester.id)
        throw new ApiError(403, 'You do not own this quotation', 'FORBIDDEN');
    return quotation;
};
const assertDraft = (quotation) => {
    if (quotation.status !== 'draft')
        throw new ApiError(409, 'Only draft quotations can be modified', 'QUOTATION_NOT_DRAFT');
};
const recalculateTotals = async (quotation) => {
    const productIds = [...new Set(quotation.lineItems.map((item) => item.product.toString()))];
    const products = await ProductModel.find({ _id: { $in: productIds } })
        .select('taxRate')
        .exec();
    const taxRateByProduct = new Map(products.map((product) => [product._id.toString(), product.taxRate]));
    let subtotal = 0;
    let lineTotalSum = 0;
    let tax = 0;
    for (const item of quotation.lineItems) {
        subtotal += item.quantity * item.unitPrice;
        lineTotalSum += item.lineTotal;
        tax += item.lineTotal * (taxRateByProduct.get(item.product.toString()) ?? 0);
    }
    quotation.subtotal = subtotal;
    quotation.totalDiscount = subtotal - lineTotalSum;
    quotation.tax = tax;
    quotation.grandTotal = lineTotalSum + tax;
};
const findLineItemIndex = (quotation, itemId) => {
    const index = quotation.lineItems.findIndex((lineItem) => lineItem._id.toString() === itemId);
    if (index === -1)
        throw new ApiError(404, 'Line item not found', 'LINE_ITEM_NOT_FOUND');
    return index;
};
// Shared with approval.service.ts (submit-approval needs the same tier ->
// approvalChain lookup this uses for categorySpecificLimits) so both stay in
// sync on the "no discount tier configured" error instead of duplicating it.
export const getDiscountTierForCustomer = async (customerId) => {
    const customer = await CustomerModel.findById(customerId).select('customerTier').exec();
    if (!customer)
        throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
    const discountTier = await DiscountTierModel.findOne({ tierName: customer.customerTier }).exec();
    if (!discountTier)
        throw new ApiError(404, `No discount tier configured for customer tier "${customer.customerTier}"`, 'DISCOUNT_TIER_NOT_FOUND');
    return discountTier;
};
const calculateBlendedRisk = async (quotation) => {
    const discountTier = await getDiscountTierForCustomer(quotation.customer);
    const productIds = [...new Set(quotation.lineItems.map((item) => item.product.toString()))];
    const products = await ProductModel.find({ _id: { $in: productIds } })
        .select('category')
        .exec();
    const categoryByProduct = new Map(products.map((product) => [product._id.toString(), product.category]));
    const violations = [];
    for (const item of quotation.lineItems) {
        const category = categoryByProduct.get(item.product.toString());
        if (!category)
            continue;
        const categoryLimit = discountTier.categorySpecificLimits.find((limit) => limit.category === category);
        const allowedDiscount = categoryLimit?.maxDiscount ?? discountTier.maxDiscountPercent;
        if (item.discountPercent > allowedDiscount) {
            violations.push({
                lineItem: item._id,
                category,
                discountGiven: item.discountPercent,
                discountAllowed: allowedDiscount,
                overagePoints: item.discountPercent - allowedDiscount,
            });
        }
    }
    const score = violations.reduce((sum, violation) => sum + violation.overagePoints, 0);
    // Formula per the architecture doc's code snippet. Note: the doc's own
    // worked example (18% discount vs a 10% limit -> claimed "medium") does not
    // match this formula on a single line item (8 overage points is "low"
    // here) -- implemented literally per the documented formula, not the prose
    // example, per product decision.
    const level = score > 20 ? 'high' : score > 10 ? 'medium' : 'low';
    return { score, level, violations };
};
export const quotationService = {
    create: async (input, requester) => {
        const customer = await CustomerModel.findById(input.customer).exec();
        if (!customer)
            throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const quotation = await QuotationModel.create({
                    quoteNumber: generateQuoteNumber(),
                    customer: customer._id,
                    createdBy: requester.id,
                    validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
                });
                return view(quotation);
            }
            catch (error) {
                if (!isDuplicateKeyError(error))
                    throw error;
            }
        }
        throw new ApiError(500, 'Failed to generate a unique quote number', 'QUOTE_NUMBER_CONFLICT');
    },
    // roleaccess.md scoping: Sales Rep sees only their own deals; Finance/Ops
    // is restricted to approved quotations; Manager (team-level) and Admin see
    // everything matching the requested filters.
    list: async (query, requester) => {
        const filter = {};
        if (query.status)
            filter.status = query.status;
        if (query.customer)
            filter.customer = query.customer;
        if (requester.role === 'sales_rep')
            filter.createdBy = requester.id;
        if (requester.role === 'finance')
            filter.status = 'approved';
        const [items, total] = await Promise.all([
            QuotationModel.find(filter)
                .sort({ createdAt: -1 })
                .skip((query.page - 1) * query.limit)
                .limit(query.limit)
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
    getById: async (id, requester) => {
        const quotation = await QuotationModel.findById(id).exec();
        if (!quotation)
            throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
        if (requester.role === 'sales_rep' && quotation.createdBy.toString() !== requester.id)
            throw new ApiError(403, 'You do not have access to this quotation', 'FORBIDDEN');
        if (requester.role === 'finance' && quotation.status !== 'approved')
            throw new ApiError(403, 'Finance can only view approved quotations', 'FORBIDDEN');
        return view(quotation);
    },
    update: async (id, input, requester) => {
        const quotation = await findOwned(id, requester);
        assertDraft(quotation);
        if (input.validUntil !== undefined)
            quotation.validUntil = new Date(input.validUntil);
        await quotation.save();
        return view(quotation);
    },
    remove: async (id, requester) => {
        const quotation = await findOwned(id, requester);
        assertDraft(quotation);
        await quotation.deleteOne();
    },
    addLineItem: async (id, input, requester) => {
        const quotation = await findOwned(id, requester);
        assertDraft(quotation);
        const product = await ProductModel.findById(input.product).exec();
        if (!product || !product.isActive)
            throw new ApiError(404, 'Product not found or inactive', 'PRODUCT_NOT_FOUND');
        let priceAdjustment = 0;
        if (input.variantId) {
            const variant = product.variants.find((candidate) => candidate._id.toString() === input.variantId);
            if (!variant)
                throw new ApiError(404, 'Product variant not found', 'VARIANT_NOT_FOUND');
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
        });
        await recalculateTotals(quotation);
        await quotation.save();
        return view(quotation);
    },
    updateLineItem: async (id, itemId, input, requester) => {
        const quotation = await findOwned(id, requester);
        assertDraft(quotation);
        const index = findLineItemIndex(quotation, itemId);
        const item = quotation.lineItems[index];
        const product = await ProductModel.findById(item.product).select('costPrice').exec();
        if (!product)
            throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
        if (input.quantity !== undefined)
            item.quantity = input.quantity;
        if (input.discountPercent !== undefined)
            item.discountPercent = input.discountPercent;
        item.lineTotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
        item.margin = item.lineTotal - item.quantity * product.costPrice;
        await recalculateTotals(quotation);
        await quotation.save();
        return view(quotation);
    },
    removeLineItem: async (id, itemId, requester) => {
        const quotation = await findOwned(id, requester);
        assertDraft(quotation);
        const index = findLineItemIndex(quotation, itemId);
        quotation.lineItems.splice(index, 1);
        await recalculateTotals(quotation);
        await quotation.save();
        return view(quotation);
    },
    calculateRisk: async (id, requester) => {
        const quotation = await findOwned(id, requester);
        assertDraft(quotation);
        const { score, level, violations } = await calculateBlendedRisk(quotation);
        quotation.blendedRiskScore = { score, level, violations };
        quotation.approvalRequired = violations.length > 0;
        await quotation.save();
        return view(quotation);
    },
};
