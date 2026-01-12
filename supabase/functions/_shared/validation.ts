// Input validation utilities for edge functions

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// Symbol validation (1-5 uppercase letters)
export function validateSymbol(symbol: unknown): ValidationResult<string> {
  if (typeof symbol !== 'string') {
    return { success: false, errors: [{ field: 'symbol', message: 'Symbol must be a string' }] };
  }
  
  const trimmed = symbol.trim().toUpperCase();
  if (!/^[A-Z]{1,5}$/.test(trimmed)) {
    return { success: false, errors: [{ field: 'symbol', message: 'Symbol must be 1-5 uppercase letters' }] };
  }
  
  return { success: true, data: trimmed };
}

// Symbols array validation
export function validateSymbols(symbols: unknown): ValidationResult<string[]> {
  if (!Array.isArray(symbols)) {
    return { success: false, errors: [{ field: 'symbols', message: 'Symbols must be an array' }] };
  }
  
  if (symbols.length === 0 || symbols.length > 100) {
    return { success: false, errors: [{ field: 'symbols', message: 'Symbols array must have 1-100 items' }] };
  }
  
  const validatedSymbols: string[] = [];
  const errors: ValidationError[] = [];
  
  for (let i = 0; i < symbols.length; i++) {
    const result = validateSymbol(symbols[i]);
    if (result.success && result.data) {
      validatedSymbols.push(result.data);
    } else {
      errors.push({ field: `symbols[${i}]`, message: result.errors?.[0]?.message || 'Invalid symbol' });
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data: validatedSymbols };
}

// Order side validation
export function validateOrderSide(side: unknown): ValidationResult<'buy' | 'sell'> {
  if (side !== 'buy' && side !== 'sell') {
    return { success: false, errors: [{ field: 'side', message: 'Side must be "buy" or "sell"' }] };
  }
  return { success: true, data: side };
}

// Positive number validation
export function validatePositiveNumber(value: unknown, field: string, max?: number): ValidationResult<number> {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { success: false, errors: [{ field, message: `${field} must be a valid number` }] };
  }
  
  if (value <= 0) {
    return { success: false, errors: [{ field, message: `${field} must be positive` }] };
  }
  
  if (max !== undefined && value > max) {
    return { success: false, errors: [{ field, message: `${field} cannot exceed ${max}` }] };
  }
  
  return { success: true, data: value };
}

// Positive integer validation
export function validatePositiveInteger(value: unknown, field: string, max?: number): ValidationResult<number> {
  const numResult = validatePositiveNumber(value, field, max);
  if (!numResult.success) return numResult;
  
  if (!Number.isInteger(numResult.data)) {
    return { success: false, errors: [{ field, message: `${field} must be a whole number` }] };
  }
  
  return numResult;
}

// Optional positive number validation
export function validateOptionalPositiveNumber(value: unknown, field: string, max?: number): ValidationResult<number | undefined> {
  if (value === undefined || value === null) {
    return { success: true, data: undefined };
  }
  return validatePositiveNumber(value, field, max);
}

// Order validation
export interface OrderInput {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType?: 'market' | 'limit' | 'stop' | 'stop_limit';
  limitPrice?: number;
  stopPrice?: number;
  optionType?: 'call' | 'put';
  strike?: number;
  expiry?: string;
  strategy?: string;
  trailingStopPercent?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  signalId?: string;
}

export function validateOrder(order: unknown): ValidationResult<OrderInput> {
  if (!order || typeof order !== 'object') {
    return { success: false, errors: [{ field: 'order', message: 'Order must be an object' }] };
  }
  
  const o = order as Record<string, unknown>;
  const errors: ValidationError[] = [];
  
  // Required fields
  const symbolResult = validateSymbol(o.symbol);
  if (!symbolResult.success) errors.push(...(symbolResult.errors || []));
  
  const sideResult = validateOrderSide(o.side);
  if (!sideResult.success) errors.push(...(sideResult.errors || []));
  
  const quantityResult = validatePositiveInteger(o.quantity, 'quantity', 1000000);
  if (!quantityResult.success) errors.push(...(quantityResult.errors || []));
  
  // Optional fields
  if (o.limitPrice !== undefined) {
    const limitResult = validatePositiveNumber(o.limitPrice, 'limitPrice', 1000000);
    if (!limitResult.success) errors.push(...(limitResult.errors || []));
  }
  
  if (o.stopPrice !== undefined) {
    const stopResult = validatePositiveNumber(o.stopPrice, 'stopPrice', 1000000);
    if (!stopResult.success) errors.push(...(stopResult.errors || []));
  }
  
  if (o.optionType !== undefined && o.optionType !== 'call' && o.optionType !== 'put') {
    errors.push({ field: 'optionType', message: 'Option type must be "call" or "put"' });
  }
  
  if (o.strike !== undefined) {
    const strikeResult = validatePositiveNumber(o.strike, 'strike', 100000);
    if (!strikeResult.success) errors.push(...(strikeResult.errors || []));
  }
  
  if (o.trailingStopPercent !== undefined) {
    const trailingResult = validatePositiveNumber(o.trailingStopPercent, 'trailingStopPercent', 100);
    if (!trailingResult.success) errors.push(...(trailingResult.errors || []));
  }
  
  if (o.stopLossPrice !== undefined) {
    const slResult = validatePositiveNumber(o.stopLossPrice, 'stopLossPrice', 1000000);
    if (!slResult.success) errors.push(...(slResult.errors || []));
  }
  
  if (o.takeProfitPrice !== undefined) {
    const tpResult = validatePositiveNumber(o.takeProfitPrice, 'takeProfitPrice', 1000000);
    if (!tpResult.success) errors.push(...(tpResult.errors || []));
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return {
    success: true,
    data: {
      symbol: symbolResult.data!,
      side: sideResult.data!,
      quantity: quantityResult.data!,
      orderType: o.orderType as OrderInput['orderType'],
      limitPrice: o.limitPrice as number | undefined,
      stopPrice: o.stopPrice as number | undefined,
      optionType: o.optionType as 'call' | 'put' | undefined,
      strike: o.strike as number | undefined,
      expiry: o.expiry as string | undefined,
      strategy: o.strategy as string | undefined,
      trailingStopPercent: o.trailingStopPercent as number | undefined,
      stopLossPrice: o.stopLossPrice as number | undefined,
      takeProfitPrice: o.takeProfitPrice as number | undefined,
      signalId: o.signalId as string | undefined,
    },
  };
}

// UUID validation
export function validateUUID(value: unknown, field: string): ValidationResult<string> {
  if (typeof value !== 'string') {
    return { success: false, errors: [{ field, message: `${field} must be a string` }] };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    return { success: false, errors: [{ field, message: `${field} must be a valid UUID` }] };
  }
  
  return { success: true, data: value };
}

// Action validation
export function validateAction<T extends string>(
  action: unknown, 
  validActions: readonly T[]
): ValidationResult<T> {
  if (typeof action !== 'string') {
    return { success: false, errors: [{ field: 'action', message: 'Action must be a string' }] };
  }
  
  if (!validActions.includes(action as T)) {
    return { 
      success: false, 
      errors: [{ field: 'action', message: `Invalid action. Must be one of: ${validActions.join(', ')}` }] 
    };
  }
  
  return { success: true, data: action as T };
}
