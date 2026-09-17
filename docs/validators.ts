// src/lib/validators.ts
import { z } from 'zod';
import { Role, PaymentMethod, StockMovementType, SaleStatus } from '@prisma/client';

// ============================================================
// TENANT (Empresa)
// ============================================================

export const createTenantSchema = z.object({
  name: z.string()
    .min(1, 'Nome da empresa é obrigatório')
    .max(255, 'Nome não pode exceder 255 caracteres'),
  type: z.enum(['CONVENIENCE', 'RESTAURANT', 'RETAIL', 'SERVICE'])
    .default('CONVENIENCE'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string()
    .regex(/^\d{10,15}$/, 'Telefone deve ter 10-15 dígitos')
    .optional()
    .or(z.literal('')),
});

export const updateTenantSchema = createTenantSchema.partial();

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// ============================================================
// USER (Usuário)
// ============================================================

export const createUserSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome não pode exceder 255 caracteres'),
  role: z.nativeEnum(Role)
    .default('STAFF'),
  password: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================
// PRODUCT (Produto)
// ============================================================

export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'Nome do produto é obrigatório')
    .max(255, 'Nome não pode exceder 255 caracteres'),
  sku: z.string()
    .min(1, 'SKU é obrigatório')
    .max(100, 'SKU não pode exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  barcode: z.string()
    .regex(/^\d{8,14}$/, 'Código de barras deve ter 8-14 dígitos')
    .optional()
    .or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  price: z.number()
    .int('Preço deve ser um número inteiro (em centavos)')
    .positive('Preço deve ser maior que 0'),
  cost: z.number()
    .int('Custo deve ser um número inteiro (em centavos)')
    .positive('Custo deve ser maior que 0')
    .optional(),
  category: z.string()
    .max(100, 'Categoria não pode exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  imageUrl: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
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
  productId: z.number().int().positive('ID do produto inválido'),
  quantity: z.number().int().min(0, 'Quantidade não pode ser negativa').default(0),
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
// STOCK MOVEMENT (Movimentação de Estoque)
// ============================================================

export const createStockMovementSchema = z.object({
  inventoryId: z.number().int().positive('ID do inventário inválido'),
  type: z.nativeEnum(StockMovementType),
  quantity: z.number()
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que 0'),
  reason: z.string().max(500).optional().or(z.literal('')),
  referenceId: z.number().int().positive().optional(),
  referenceType: z.string().max(50).optional(),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;

// ============================================================
// SALE (Venda - PDV)
// ============================================================

// Validar item individual da venda
export const saleItemSchema = z.object({
  productId: z.number().int().positive('ID do produto inválido'),
  quantity: z.number()
    .int('Quantidade deve ser inteira')
    .positive('Quantidade deve ser maior que 0'),
  unitPrice: z.number()
    .int('Preço deve ser em centavos')
    .positive('Preço deve ser maior que 0'),
  discount: z.number().int().min(0, 'Desconto não pode ser negativo').default(0),
});

export const createSaleSchema = z.object({
  userId: z.number().int().positive('ID do usuário inválido'),
  cashBoxId: z.number().int().positive().optional(),
  items: z.array(saleItemSchema)
    .min(1, 'Venda deve ter no mínimo um item'),
  discount: z.number().int().min(0, 'Desconto não pode ser negativo').default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).default('CASH'),
  customerName: z.string().max(255).optional().or(z.literal('')),
  customerPhone: z.string()
    .regex(/^\d{10,15}$/, 'Telefone deve ter 10-15 dígitos')
    .optional()
    .or(z.literal('')),
});

export const cancelSaleSchema = z.object({
  reason: z.string().min(1, 'Motivo do cancelamento é obrigatório').max(500),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;

// ============================================================
// CASHBOX (Caixa)
// ============================================================

export const createCashBoxSchema = z.object({
  name: z.string()
    .min(1, 'Nome da caixa é obrigatório')
    .max(255, 'Nome não pode exceder 255 caracteres'),
  openingBalance: z.number()
    .int('Valor deve ser em centavos')
    .min(0, 'Saldo inicial não pode ser negativo')
    .default(0),
  operatorName: z.string().max(255).optional(),
});

export const openCashBoxSchema = z.object({
  openingBalance: z.number()
    .int('Valor deve ser em centavos')
    .min(0, 'Saldo inicial não pode ser negativo'),
});

export const closeCashBoxSchema = z.object({
  closingBalance: z.number()
    .int('Valor deve ser em centavos')
    .min(0, 'Saldo de fechamento não pode ser negativo'),
});

export type CreateCashBoxInput = z.infer<typeof createCashBoxSchema>;
export type OpenCashBoxInput = z.infer<typeof openCashBoxSchema>;
export type CloseCashBoxInput = z.infer<typeof closeCashBoxSchema>;

// ============================================================
// FINANCIAL MOVEMENT (Movimentação Financeira)
// ============================================================

export const createFinancialMovementSchema = z.object({
  type: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  category: z.string()
    .min(1, 'Categoria é obrigatória')
    .max(100, 'Categoria não pode exceder 100 caracteres'),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição não pode exceder 500 caracteres'),
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
// SETTINGS (Configurações)
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
// SHARED VALIDATION UTILITIES
// ============================================================

/**
 * Valida se um valor é uma quantia válida em centavos
 */
export function isValidCentAmount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Converte reais para centavos
 * Exemplo: 10.50 → 1050
 */
export function reaisToCents(value: number): number {
  return Math.round(value * 100);
}

/**
 * Converte centavos para reais
 * Exemplo: 1050 → 10.50
 */
export function centsToReais(value: number): number {
  return value / 100;
}

/**
 * Formata centavos como moeda brasileira
 * Exemplo: 1050 → "R$ 10,50"
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/**
 * Valida se uma string é um email válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se uma string é um telefone válido (Brasil)
 * Aceita: (11) 99999-9999 ou 11999999999
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\(\d{2}\)\s?)?\d{8,9}$/;
  return phoneRegex.replace(/\D/g, '').length >= 10;
}

/**
 * Valida se um SKU é único e válido
 * Padrão: Alfanumérico, hífens e underscores permitidos
 */
export function isValidSKU(sku: string): boolean {
  const skuRegex = /^[a-zA-Z0-9_-]{1,100}$/;
  return skuRegex.test(sku);
}

/**
 * Valida se um código de barras é válido
 * Padrão: 8-14 dígitos (EAN-8, EAN-13, UPC-A)
 */
export function isValidBarcode(barcode: string): boolean {
  return /^\d{8}(\d{5}|\d{6})?$/.test(barcode);
}

/**
 * Calcula margem de lucro
 * Exemplo: custo=600, venda=1000 → margem=40%
 */
export function calculateMargin(cost: number, sellPrice: number): number {
  if (cost <= 0) return 0;
  return ((sellPrice - cost) / sellPrice) * 100;
}

/**
 * Calcula preço de venda baseado em margem
 * Exemplo: custo=600, margem=40% → venda=1000
 */
export function calculateSellPrice(cost: number, marginPercent: number): number {
  if (marginPercent >= 100) return cost * 2; // Evita divisão por zero
  return Math.round(cost / (1 - marginPercent / 100));
}

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * Tipos de erro de validação
 */
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

/**
 * Classe customizada para erros de validação
 */
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
