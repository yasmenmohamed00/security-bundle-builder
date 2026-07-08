export interface Variant {
  id: string;
  label: string;
}

export type CategoryId = 'cameras' | 'sensors' | 'accessories' | 'plan';

export interface Product {
  id: string;
  stepId: string;
  category: Exclude<CategoryId, 'plan'>;
  name: string;
  description?: string;
  learnMoreUrl?: string;
  badge?: string;
  image: string;
  /** Pre-discount price. Rendered struck-through when present. */
  compareAtPrice?: number;
  price: number;
  variants?: Variant[];

}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  learnMoreUrl?: string;
  badge?: string;
  image: string;
  monthlyPrice: number;
  compareAtMonthlyPrice?: number;
  billingCycle: 'monthly';
}

export interface Step {
  id: string;
  title: string;
  icon: string;
  /** What this step's cards render: unit products or the plan choice. */
  source: 'products' | 'plans';
  nextLabel?: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  mobileLabel: string;
}

export interface CatalogConfig {
  currency: string;
  shipping: { label: string; price: number; freeThreshold: number };
  guarantee: { seal: string; title: string; body: string };
  financing: { prefix: string; months: number; apr: number };
  savingsMessage: string;
}

export interface Catalog {
  config: CatalogConfig;
  steps: Step[];
  categories: Category[];
  products: Product[];
  plans: Plan[];
  seed: BundleSnapshot;
}

/* ---------------------------------------------------------------------------
   State. Products use a quantity map (multi-select, per-SKU); the plan uses
   a single slot — two plans selected at once is unrepresentable by shape.
--------------------------------------------------------------------------- */

export interface BundleSnapshot {
  openStepId: string;
  /** Product quantities keyed by `productId` or `productId:variantId` (SKU). */
  quantities: Record<string, number>;
  /** The exclusive plan choice. Assignment IS the deselection of the old one. */
  planId: string | null;
  /** Currently active variant per product (drives the card's stepper binding). */
  activeVariants: Record<string, string>;
}

export interface BundleState extends BundleSnapshot {
  savedAt: string | null;
}

export type LineRef =
  | { kind: 'product'; id: string; variantId?: string }
  | { kind: 'plan'; id: string };

export interface LineItem {
  ref: LineRef;
  /** Stable identity; for products this is the SKU key used in state. */
  key: string;
  category: CategoryId;
  name: string;
  image?: string;
  variantLabel?: string;
  qty: number;
  unitPrice: number;
  unitCompareAt?: number;
  /** Billing suffix for recurring lines ("$9.99/mo"). */
  per?: 'mo';
}
