import { auditLogPaths } from './paths/audit-log.paths.js';
import { approvalPaths } from './paths/approval.paths.js';
import { authPaths } from './paths/auth.paths.js';
import { customerPaths } from './paths/customer.paths.js';
import { discountTierPaths } from './paths/discount-tier.paths.js';
import { healthPaths } from './paths/health.paths.js';
import { portalPaths } from './paths/portal.paths.js';
import { pricelistPaths } from './paths/pricelist.paths.js';
import { productPaths } from './paths/product.paths.js';
import { orderPaths } from './paths/order.paths.js';
import { quotationPaths } from './paths/quotation.paths.js';
import { reportPaths } from './paths/report.paths.js';
import { subscriptionPlanPaths } from './paths/subscription-plan.paths.js';
import { subscriptionPaths } from './paths/subscription.paths.js';
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
    { name: 'Subscription Plans', description: 'Billing cycles, proration and cancellation' },
    { name: 'Customers', description: 'Customer records and rep assignment' },
    { name: 'Reports', description: 'Sales, product and approval analytics' },
    { name: 'Audit Logs', description: 'Recorded create, update and delete activity' },
    { name: 'Quotations', description: 'Quotation building, risk scoring, and submission' },
    { name: 'Approvals', description: 'Approval queue and approval decisions' },
    { name: 'Orders', description: 'Order fulfillment allocation' },
    {
      name: 'Subscriptions',
      description: 'Subscription lifecycle, proration and recurring billing',
    },
    { name: 'Portal', description: 'Customer-facing quotation viewing and negotiation' },
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
          currency: { type: 'string', minLength: 3, maxLength: 3, default: 'INR', example: 'INR' },
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
      AuditLog: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            enum: ['quotation', 'approval', 'order', 'invoice', 'product', 'customer'],
          },
          entityId: { type: 'string', description: '24-hex id of the affected record' },
          action: {
            type: 'string',
            enum: ['created', 'updated', 'deleted', 'approved', 'rejected', 'sent'],
          },
          performedBy: { $ref: '#/components/schemas/User' },
          changes: {
            type: 'object',
            description: 'The submitted request body, with credential fields redacted.',
          },
          reason: { type: 'string' },
          ipAddress: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ProrationRules: {
        type: 'object',
        required: ['onUpgrade', 'onDowngrade'],
        properties: {
          onUpgrade: { type: 'string', enum: ['immediate', 'next_cycle'], example: 'immediate' },
          onDowngrade: {
            type: 'string',
            enum: ['immediate', 'next_cycle'],
            example: 'next_cycle',
          },
        },
      },
      CancellationPolicy: {
        type: 'object',
        required: ['refundType', 'effectiveDate'],
        properties: {
          refundType: { type: 'string', enum: ['none', 'prorated', 'full'], example: 'prorated' },
          effectiveDate: {
            type: 'string',
            enum: ['immediate', 'end_of_period'],
            example: 'end_of_period',
          },
        },
      },
      SubscriptionPlan: {
        type: 'object',
        required: ['name', 'billingCycle', 'billingIntervalDays'],
        properties: {
          name: { type: 'string', example: 'Monthly Standard' },
          billingCycle: {
            type: 'string',
            enum: ['monthly', 'quarterly', 'yearly'],
            example: 'monthly',
          },
          billingIntervalDays: { type: 'integer', minimum: 1, example: 30 },
          prorationRules: { $ref: '#/components/schemas/ProrationRules' },
          cancellationPolicy: { $ref: '#/components/schemas/CancellationPolicy' },
        },
      },
      CustomerInput: {
        type: 'object',
        required: ['companyName', 'contactEmail'],
        properties: {
          companyName: { type: 'string', example: 'Acme Corp' },
          contactEmail: { type: 'string', format: 'email', example: 'buyer@acme.com' },
          contactName: { type: 'string', example: 'Alex Buyer' },
          customerTier: { type: 'string', enum: ['bronze', 'silver', 'gold'], example: 'bronze' },
          creditScore: { type: 'number', minimum: 0, maximum: 1000, example: 700 },
          paymentTerms: { type: 'string', example: 'Net 30' },
          assignedRep: { type: 'string', description: '24-hex user id of a sales_rep' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          companyName: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          contactName: { type: 'string' },
          customerTier: { type: 'string', enum: ['bronze', 'silver', 'gold'] },
          creditScore: { type: 'number' },
          paymentTerms: { type: 'string' },
          assignedRep: { $ref: '#/components/schemas/User' },
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
    ...subscriptionPlanPaths,
    ...customerPaths,
    ...reportPaths,
    ...auditLogPaths,
    ...quotationPaths,
    ...approvalPaths,
    ...orderPaths,
    ...subscriptionPaths,
    ...portalPaths,
    ...healthPaths,
  },
} as const;
