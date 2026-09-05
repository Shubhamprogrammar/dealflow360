import { authPaths } from './paths/auth.paths.js';
import { discountTierPaths } from './paths/discount-tier.paths.js';
import { healthPaths } from './paths/health.paths.js';
import { pricelistPaths } from './paths/pricelist.paths.js';
import { productPaths } from './paths/product.paths.js';
import { userPaths } from './paths/user.paths.js';
import { warehousePaths } from './paths/warehouse.paths.js';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'DealFlow360 API',
    version: '1.0.0',
    description:
      'Quote-to-cash backend. Staff routes use bearer auth; customer portal routes issue a separate token type that staff routes reject.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth', description: 'Staff and customer authentication' },
    { name: 'Users', description: 'Internal user management' },
    { name: 'Products', description: 'Catalogue and variants' },
    { name: 'Price Lists', description: 'Tier-specific pricing' },
    { name: 'Discount Tiers', description: 'Discount limits and approval chain configuration' },
    { name: 'Warehouses', description: 'Warehouse setup and stock levels' },
    { name: 'Health', description: 'Liveness and readiness' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: { type: 'object', properties: { code: { type: 'string' } } },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
      Tokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      CustomerSession: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          customerId: { type: 'string' },
          companyName: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'sales_rep', 'sales_manager', 'finance'] },
          team: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      UserInput: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password', 'role'],
        properties: {
          firstName: { type: 'string', example: 'Priya' },
          lastName: { type: 'string', example: 'Sharma' },
          email: { type: 'string', format: 'email', example: 'priya@dealflow.com' },
          password: { type: 'string', minLength: 8, example: 'password123' },
          role: { type: 'string', enum: ['admin', 'sales_rep', 'sales_manager', 'finance'] },
          team: { type: 'string', example: 'West' },
        },
      },
      Variant: {
        type: 'object',
        required: ['attributeName', 'attributeValue'],
        properties: {
          attributeName: { type: 'string', example: 'Size' },
          attributeValue: { type: 'string', example: 'Large' },
          priceAdjustment: { type: 'number', example: 50 },
        },
      },
      Product: {
        type: 'object',
        required: ['name', 'category', 'basePrice', 'costPrice'],
        properties: {
          name: { type: 'string', example: 'Laptop' },
          category: { type: 'string', enum: ['hardware', 'services', 'subscriptions'] },
          basePrice: { type: 'number', minimum: 0, example: 1200 },
          costPrice: { type: 'number', minimum: 0, example: 800 },
          unit: { type: 'string', example: 'unit' },
          taxRate: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            example: 0.1,
            description: 'Fraction, not percent. 0.1 means 10%.',
          },
          description: { type: 'string' },
          maxDiscountByCategory: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Percent, 0-100.',
          },
          isSubscription: { type: 'boolean' },
          variants: { type: 'array', items: { $ref: '#/components/schemas/Variant' } },
        },
      },
      PriceList: {
        type: 'object',
        required: ['name', 'customerTier', 'productPrices'],
        properties: {
          name: { type: 'string', example: 'Gold 2026' },
          customerTier: { type: 'string', enum: ['bronze', 'silver', 'gold'], example: 'gold' },
          currency: { type: 'string', minLength: 3, maxLength: 3, example: 'USD' },
          productPrices: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['product', 'customPrice'],
              properties: {
                product: { type: 'string', description: '24-hex product id' },
                customPrice: { type: 'number', minimum: 0, example: 1000 },
              },
            },
          },
          validFrom: { type: 'string', format: 'date-time' },
          validTo: { type: 'string', format: 'date-time' },
        },
      },
      CategoryLimit: {
        type: 'object',
        required: ['category', 'maxDiscount'],
        properties: {
          category: { type: 'string', enum: ['hardware', 'services', 'subscriptions'] },
          maxDiscount: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            example: 10,
            description: 'Percent, 0-100. May exceed the tier maxDiscountPercent.',
          },
        },
      },
      ApprovalChainRule: {
        type: 'object',
        required: ['minDiscount', 'maxDiscount', 'requiredApprovers'],
        properties: {
          minDiscount: { type: 'number', minimum: 0, maximum: 100, example: 10 },
          maxDiscount: { type: 'number', minimum: 0, maximum: 100, example: 20 },
          requiredApprovers: {
            type: 'array',
            minItems: 1,
            items: { type: 'string', enum: ['admin', 'sales_rep', 'sales_manager', 'finance'] },
          },
        },
      },
      DiscountTier: {
        type: 'object',
        required: ['tierName', 'maxDiscountPercent'],
        properties: {
          tierName: {
            type: 'string',
            enum: ['bronze', 'silver', 'gold'],
            example: 'bronze',
            description: 'Case-insensitive on input; stored lowercase to match the customer tier.',
          },
          maxDiscountPercent: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            example: 5,
            description: 'Percent, 0-100.',
          },
          categorySpecificLimits: {
            type: 'array',
            items: { $ref: '#/components/schemas/CategoryLimit' },
          },
          approvalChain: {
            type: 'array',
            items: { $ref: '#/components/schemas/ApprovalChainRule' },
          },
        },
      },
      StockLevel: {
        type: 'object',
        required: ['product', 'quantity'],
        properties: {
          product: { type: 'string', description: '24-hex product id' },
          quantity: { type: 'integer', minimum: 0, example: 10 },
          reorderPoint: { type: 'integer', minimum: 0, example: 2 },
        },
      },
      WarehouseInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Main Warehouse' },
          location: { type: 'string', example: 'Pune' },
          shippingCostWeight: {
            type: 'number',
            minimum: 0,
            example: 1,
            description: 'Relative shipping cost used when splitting fulfilment.',
          },
        },
      },
      Warehouse: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Main Warehouse' },
          location: { type: 'string', example: 'Pune' },
          shippingCostWeight: {
            type: 'number',
            minimum: 0,
            example: 1,
            description: 'Relative shipping cost used when splitting fulfilment.',
          },
          isActive: { type: 'boolean' },
          stockLevels: { type: 'array', items: { $ref: '#/components/schemas/StockLevel' } },
        },
      },
    },
  },
  paths: {
    ...authPaths,
    ...userPaths,
    ...productPaths,
    ...pricelistPaths,
    ...discountTierPaths,
    ...warehousePaths,
    ...healthPaths,
  },
} as const;
