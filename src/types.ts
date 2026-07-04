export interface Variant {
    id: string;
    label: string;
  }
  
  export type CategoryId = 'cameras' | 'sensors' | 'accessories' | 'plan';
  
  export interface Product {
    id: string;
    stepId: string;
    category: CategoryId;
    name: string;
    description?: string;
    learnMoreUrl?: string;
    badge?: string;
    image: string;
    /** Pre-discount price. Rendered struck-through when present. */
    compareAtPrice?: number;
    price: number;
    /** Billing period suffix, e.g. "mo" renders "$9.99/mo". */
    per?: 'mo';
    variants?: Variant[];
    /** Required items (e.g. the hub) render a locked, disabled stepper. */
    required?: boolean;
    /** Plan rows render the brand logo lockup instead of a thumbnail. */
    planLogo?: boolean;
  }
  
  export interface Step {
    id: string;
    title: string;
    icon: string;
    category: CategoryId;
    nextLabel?: string;
    /** Exclusive steps (the plan) allow exactly one selected product. */
    exclusive?: boolean;
  }
  
  export interface Category {
    id: CategoryId;
    label: string;
    mobileLabel: string;
  }
  
  export interface CatalogConfig {
    currency: string;
    shipping: { label: string; compareAtPrice: number; price: number };
    guarantee: { seal: string; title: string; body: string };
    financing: { prefix: string; months: number; apr: number };
    savingsMessage: string;
  }
  
  export interface Catalog {
    config: CatalogConfig;
    steps: Step[];
    categories: Category[];
    products: Product[];
    seed: BundleSnapshot;
  }
  
  /** The persisted / seeded part of the state. */
  export interface BundleSnapshot {
    openStepId: string;
    /** Quantities keyed by `productId` or `productId:variantId`. */
    quantities: Record<string, number>;
    /** Currently active variant per product (drives the card's stepper binding). */
    activeVariants: Record<string, string>;
  }
  
  export interface BundleState extends BundleSnapshot {
    savedAt: string | null;
  }
  
  /** A resolved review-panel line (one per variant with qty > 0). */
  export interface ReviewLine {
    key: string;
    product: Product;
    variant?: Variant;
    qty: number;
    lineTotal: number;
    lineCompareTotal?: number;
  }
  