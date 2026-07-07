import type { BundleSnapshot, LineItem, Product } from '../types';

/** Product quantities are stored under `productId` or `productId:variantId`. */
export function selectionKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Total units of a product across all of its variants. */
export function totalQty(state: BundleSnapshot, product: Product): number {
  if (!product.variants) return state.quantities[product.id] ?? 0;
  return product.variants.reduce(
    (sum, v) => sum + (state.quantities[selectionKey(product.id, v.id)] ?? 0),
    0,
  );
}

export function lineTotal(line: LineItem): number {
  return round(line.qty * line.unitPrice);
}

export function lineCompareTotal(line: LineItem): number | undefined {
  return line.unitCompareAt !== undefined ? round(line.qty * line.unitCompareAt) : undefined;
}

export interface Totals {
  total: number;
  compareTotal: number;
  savings: number;
}

/**
 * Consumes LineItems only — it has no idea which lines are plans and which
 * are products.
 */
export function totals(lines: LineItem[]): Totals {
  const total = round(lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0));
  const compareTotal = round(
    lines.reduce((sum, l) => sum + l.qty * (l.unitCompareAt ?? l.unitPrice), 0),
  );
  return { total, compareTotal, savings: round(compareTotal - total) };
}


export function financingMonthly(total: number, months: number, apr: number): number {
  if (total <= 0) return 0;
  const r = apr / 12;
  if (r === 0) return round(total / months);
  const factor = Math.pow(1 + r, months);
  return round((total * r * factor) / (factor - 1));
}
