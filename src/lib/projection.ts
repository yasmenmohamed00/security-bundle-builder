import { catalog, planById, productById, productsByStep, skuOrder } from '../data/catalog';
import { selectionKey, totalQty } from './pricing';
import type { BundleSnapshot, LineItem, Plan, Step } from '../types';

/**
 * THE translation point between the domain (products, plans) and the cart.
 * Both entity kinds are projected into the shared LineItem shape here and
 * nowhere else; everything downstream (totals, review panel, financing) is
 * entity-agnostic.
 *
 * Iterates the SELECTIONS, not the catalog: O(selected) per call instead of
 * O(catalog), which is what makes it safe for arbitrarily large catalogs.
 * The price of that direction is paid explicitly below: stale keys are
 * validated out (a saved snapshot may reference removed products), and
 * catalog display order is restored with the precomputed skuOrder index.
 */
export function toLineItems(state: BundleSnapshot): LineItem[] {
  const lines: LineItem[] = [];

  for (const [key, qty] of Object.entries(state.quantities)) {
    if (qty <= 0) continue;

    const [productId, variantId] = key.split(':');
    const product = productById.get(productId);
    if (!product) continue; // stale key: product no longer in catalog

    const variant = variantId ? product.variants?.find((v) => v.id === variantId) : undefined;
    if (variantId && !variant) continue; // stale key: variant no longer exists

    lines.push({
      ref: { kind: 'product', id: product.id, variantId },
      key,
      category: product.category,
      name: product.name,
      image: product.image,
      variantLabel: variant?.label,
      qty,
      unitPrice: product.price,
      unitCompareAt: product.compareAtPrice,
    });
  }
  // the design's order, stable no matter the click sequence.
  lines.sort((a, b) => (skuOrder.get(a.key) ?? 0) - (skuOrder.get(b.key) ?? 0));

  const plan = state.planId ? planById.get(state.planId) : undefined;
  if (plan) lines.push(planLine(plan));

  return lines;
}

function planLine(plan: Plan): LineItem {
  return {
    ref: { kind: 'plan', id: plan.id },
    key: `plan:${plan.id}`,
    category: 'plan',
    name: plan.name,
    image: plan.image,
    qty: 1,
    unitPrice: plan.monthlyPrice,
    unitCompareAt: plan.compareAtMonthlyPrice,
    per: 'mo',
  };
}

/** "N selected" per step: distinct products with any qty, or the plan slot. */
export function stepSelectedCount(state: BundleSnapshot, step: Step): number {
  if (step.source === 'plans') return state.planId ? 1 : 0;
  const products = productsByStep.get(step.id) ?? [];
  return products.filter((p) => totalQty(state, p) > 0).length;
}

export { catalog, selectionKey };
