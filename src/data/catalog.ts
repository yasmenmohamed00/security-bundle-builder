import rawCatalog from './catalog.json';
import type { Catalog, Plan, Product, Step } from '../types';
import { selectionKey } from '../lib/pricing';

export const catalog = rawCatalog as unknown as Catalog;

export const productById: ReadonlyMap<string, Product> = new Map(
  catalog.products.map((p) => [p.id, p]),
);

export const planById: ReadonlyMap<string, Plan> = new Map(catalog.plans.map((p) => [p.id, p]));

export const stepById: ReadonlyMap<string, Step> = new Map(catalog.steps.map((s) => [s.id, s]));

export const productsByStep: ReadonlyMap<string, Product[]> = (() => {
  const map = new Map<string, Product[]>();
  for (const step of catalog.steps) map.set(step.id, []);
  for (const product of catalog.products) map.get(product.stepId)?.push(product);
  return map;
})();

/** Catalog position of every SKU key — restores design order after projection. */
export const skuOrder: ReadonlyMap<string, number> = (() => {
  const map = new Map<string, number>();
  let i = 0;
  for (const product of catalog.products) {
    for (const variant of product.variants ?? [undefined]) {
      map.set(selectionKey(product.id, variant?.id), i++);
    }
  }
  return map;
})();
