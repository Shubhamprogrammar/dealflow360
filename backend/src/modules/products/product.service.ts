import type { FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { buildPagination, toSkip, type Pagination } from '../../utils/pagination.js';
import { ProductModel, type ProductDocument } from './product.model.js';
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
  VariantInput,
} from './product.types.js';

const notFound = (): ApiError => new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');

const findActiveOrThrow = async (
  id: string,
): Promise<ProductDocument & { save: () => unknown }> => {
  const product = await ProductModel.findById(id).exec();
  if (!product) throw notFound();
  return product;
};

export const productService = {
  create: async (input: CreateProductInput): Promise<ProductDocument> => {
    if (input.costPrice > input.basePrice)
      throw new ApiError(422, 'Cost price cannot exceed base price', 'INVALID_PRICING');
    return ProductModel.create(input);
  },

  list: async (
    query: ListProductsQuery,
  ): Promise<{ products: ProductDocument[]; pagination: Pagination }> => {
    const filter: FilterQuery<ProductDocument> = {};
    if (query.category) filter.category = query.category;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };
    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .exec(),
      ProductModel.countDocuments(filter).exec(),
    ]);
    return { products, pagination: buildPagination(query, total) };
  },

  getById: async (id: string): Promise<ProductDocument> => {
    const product = await ProductModel.findById(id).exec();
    if (!product) throw notFound();
    return product;
  },

  update: async (id: string, input: UpdateProductInput): Promise<ProductDocument> => {
    const product = await findActiveOrThrow(id);
    const basePrice = input.basePrice ?? product.basePrice;
    const costPrice = input.costPrice ?? product.costPrice;
    if (costPrice > basePrice)
      throw new ApiError(422, 'Cost price cannot exceed base price', 'INVALID_PRICING');
    Object.assign(product, input);
    await product.save();
    return product;
  },

  // Products are referenced by quotations and orders, so removal is a deactivation.
  deactivate: async (id: string): Promise<ProductDocument> => {
    const product = await findActiveOrThrow(id);
    product.isActive = false;
    await product.save();
    return product;
  },

  addVariant: async (id: string, input: VariantInput): Promise<ProductDocument> => {
    const product = await findActiveOrThrow(id);
    const duplicate = product.variants.some(
      (v) => v.attributeName === input.attributeName && v.attributeValue === input.attributeValue,
    );
    if (duplicate)
      throw new ApiError(409, 'Variant already exists for this product', 'VARIANT_EXISTS');
    product.variants.push({ priceAdjustment: 0, ...input } as never);
    await product.save();
    return product;
  },

  updateVariant: async (
    id: string,
    variantId: string,
    input: Partial<VariantInput>,
  ): Promise<ProductDocument> => {
    const product = await findActiveOrThrow(id);
    const variant = product.variants.find((v) => v._id.toString() === variantId);
    if (!variant) throw new ApiError(404, 'Variant not found', 'VARIANT_NOT_FOUND');
    Object.assign(variant, input);
    await product.save();
    return product;
  },
};
