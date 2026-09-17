import { z } from 'zod';
import { Role, PaymentMethod, StockMovementType, SaleStatus, CategoryKind } from '@prisma/client';

// ============================================================
// TENANT (Empresa)
// ============================================================

export const createTenantSchema = z.object({
  name: z.string()
    .min(1, 'Nome da empresa e obrigatorio')
    .max(255, 'Nome nao pode exceder 255 caracteres'),
  type: z.enum(['CONVENIENCE', 'RESTAURANT', 'RETAIL', 'SERVICE'])
    .default('CONVENIENCE'),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  phone: z.string()
    .regex(/^\d{10,15}$/, 'Telefone deve ter 10-15 digitos')
    .optional()
    .or(z.literal('')),
});

export const updateTenantSchema = createTenantSchema.partial();

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// ============================================================
// USER (Usuario)
// ============================================================

export const createUserSchema = z.object({
  email: z.string()
    .email('Email invalido')
    .min(1, 'Email e obrigatorio'),
  name: z.string()
    .min(1, 'Nome e obrigatorio')
    .max(255, 'Nome nao pode exceder 255 caracteres'),
  role: z.nativeEnum(Role)
    .default('STAFF'),
  password: z.string()
    .min(6, 'Senha deve ter no minimo 6 caracteres')
    .optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha e obrigatoria'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================
// PRODUCT (Produto)
// ============================================================

export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'Nome do produto e obrigatorio')
    .max(255, 'Nome nao pode exceder 255 caracteres'),
  sku: z.string()
    .min(1, 'SKU e obrigatorio')
    .max(100, 'SKU nao pode exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  barcode: z.string()
    .regex(/^\d{8,14}$/, 'Codigo de barras deve ter 8-14 digitos')
    .optional()
    .or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  price: z.number()
    .int('Preco deve ser um numero inteiro (em centavos)')
    .positive('Preco deve ser maior que 0'),
  cost: z.number()
    .int('Custo deve ser um numero inteiro (em centavos)')
    .positive('Custo deve ser maior que 0')
    .optional(),
  category: z.string()
    .max(100, 'Categoria nao pode exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  imageUrl: z.string().url('URL de imagem invalida').optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkCreateProductSchema = z.array(createProductSchema);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type BulkCreateProductInput = z.infer<typeof bulkCreateProductSchema>;

// ============================================================
// INVENTORY (Estoque)
// ============================================================

export const createInventorySchema = z.object({
  productId: z.number().int().positive('ID do produto invalido'),
  quantity: z.number().int().min(0, 'Quantidade nao pode ser negativa').default(0),
  minimumStock: z.number().int().min(0).default(0),
  maximumStock: z.number().int().positive().optional(),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0).optional(),
  minimumStock: z.number().int().min(0).optional(),
  maximumStock: z.number().int().positive().optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

// ============================================================
// STOCK MOVEMENT (Movimentacao de Estoque)
// ============================================================

export const createStockMovementSchema = z.object({
  inventoryId: z.number().int().positive('ID do inventario invalido'),
  type: z.nativeEnum(StockMovementType),
  quantity: z.number()
    .int('Quantidade deve ser um numero inteiro')
    .positive('Quantidade deve ser maior que 0'),
  reason: z.string().max(500).optional().or(z.literal('')),
  referenceId: z.number().int().positive().optional(),
  referenceType: z.string().max(50).optional(),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;

// ============================================================
// SALE (Venda - PDV)
// ============================================================

export const saleItemSchema = z.object({
  productId: z.number().int().positive('ID do produto invalido'),
  quantity: z.number()
    .int('Quantidade deve ser inteira')
    .positive('Quantidade deve ser maior que 0'),
  unitPrice: z.number()
    .int('Preco deve ser em centavos')
    .positive('Preco deve ser maior que 0'),
  discount: z.number().int().min(0, 'Desconto nao pode ser negativo').default(0),
});

export const createSaleSchema = z.object({
  userId: z.number().int().positive('ID do usuario invalido'),
  cashBoxId: z.number().int().positive().optional(),
  items: z.array(saleItemSchema)
    .min(1, 'Venda deve ter no minimo um item'),
  discount: z.number().int().min(0, 'Desconto nao pode ser negativo').default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).default('CASH'),
  customerName: z.string().max(255).optional().or(z.literal('')),
  customerPhone: z.string()
    .regex(/^\d{10,15}$/, 'Telefone deve ter 10-15 digitos')
    .optional()
    .or(z.literal('')),
});

export const cancelSaleSchema = z.object({
  reason: z.string().min(1, 'Motivo do cancelamento e obrigatorio').max(500),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;

// ============================================================
// CASHBOX (Caixa)
// ============================================================

export const createCashBoxSchema = z.object({
  name: z.string()
    .min(1, 'Nome da caixa e obrigatorio')
    .max(255, 'Nome nao pode exceder 255 caracteres'),
  openingBalance: z.number()
    .int('Valor deve ser em centavos')
    .min(0, 'Saldo inicial nao pode ser negativo')
    .default(0),
  operatorName: z.string().max(255).optional(),
});

export const openCashBoxSchema = z.object({
  openingBalance: z.number()
    .int('Valor deve ser em centavos')
    .min(0, 'Saldo inicial nao pode ser negativo'),
});

export const closeCashBoxSchema = z.object({
  closingBalance: z.number()
    .int('Valor deve ser em centavos')
    .min(0, 'Saldo de fechamento nao pode ser negativo'),
});

export type CreateCashBoxInput = z.infer<typeof createCashBoxSchema>;
export type OpenCashBoxInput = z.infer<typeof openCashBoxSchema>;
export type CloseCashBoxInput = z.infer<typeof closeCashBoxSchema>;

// ============================================================
// FINANCIAL MOVEMENT (Movimentacao Financeira)
// ============================================================

export const createFinancialMovementSchema = z.object({
  type: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  category: z.string()
    .min(1, 'Categoria e obrigatoria')
    .max(100, 'Categoria nao pode exceder 100 caracteres'),
  description: z.string()
    .min(1, 'Descricao e obrigatoria')
    .max(500, 'Descricao nao pode exceder 500 caracteres'),
  amount: z.number()
    .int('Valor deve ser em centavos')
    .positive('Valor deve ser maior que 0'),
  movementDate: z.coerce.date()
    .default(() => new Date()),
  cashBoxId: z.number().int().positive().optional(),
});

export const updateFinancialMovementSchema = createFinancialMovementSchema.partial();

export const markAsPaidSchema = z.object({
  paidAt: z.coerce.date().optional(),
});

export type CreateFinancialMovementInput = z.infer<typeof createFinancialMovementSchema>;
export type UpdateFinancialMovementInput = z.infer<typeof updateFinancialMovementSchema>;
export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>;

// ============================================================
// SETTINGS (Configuracoes)
// ============================================================

export const updateTenantSettingsSchema = z.object({
  enableDiscount: z.boolean().optional(),
  maxDiscount: z.number().int().min(0).max(100).optional(),
  enableStockControl: z.boolean().optional(),
  allowNegativeStock: z.boolean().optional(),
  autoGenerateDailyReport: z.boolean().optional(),
  companyLogoUrl: z.string().url().optional(),
});

export type UpdateTenantSettingsInput = z.infer<typeof updateTenantSettingsSchema>;

// ============================================================
// CATEGORY (Categoria)
// ============================================================

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  kind: z.nativeEnum(CategoryKind),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// ============================================================
// SHARED VALIDATION UTILITIES
// ============================================================

export function isValidCentAmount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function reaisToCents(value: number): number {
  return Math.round(value * 100);
}

export function centsToReais(value: number): number {
  return value / 100;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10;
}

export function isValidSKU(sku: string): boolean {
  const skuRegex = /^[a-zA-Z0-9_-]{1,100}$/;
  return skuRegex.test(sku);
}

export function isValidBarcode(barcode: string): boolean {
  return /^\d{8}(\d{5}|\d{6})?$/.test(barcode);
}

export function calculateMargin(cost: number, sellPrice: number): number {
  if (cost <= 0) return 0;
  return ((sellPrice - cost) / sellPrice) * 100;
}

export function calculateSellPrice(cost: number, marginPercent: number): number {
  if (marginPercent >= 100) return cost * 2;
  return Math.round(cost / (1 - marginPercent / 100));
}

// ============================================================
// ERROR HANDLING
// ============================================================

export enum ValidationErrorType {
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_SKU = 'INVALID_SKU',
  INVALID_BARCODE = 'INVALID_BARCODE',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  DUPLICATE_SKU = 'DUPLICATE_SKU',
  DUPLICATE_BARCODE = 'DUPLICATE_BARCODE',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_DISCOUNT = 'INVALID_DISCOUNT',
  EMPTY_SALE = 'EMPTY_SALE',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  CLOSED_CASHBOX = 'CLOSED_CASHBOX',
  INVALID_DATE = 'INVALID_DATE',
}

export class ValidationError extends Error {
  constructor(
    public type: ValidationErrorType,
    public message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================
// TYPE EXPORTS
// ============================================================

export type ValidatorError = {
  field: string;
  message: string;
  type: string;
};
