# Take-Home Bundle Builder

A multi-step bundle builder for configuring a home security system, with a live review panel that recalculates as you build. Rebuilt from the provided Figma as a React + TypeScript prototype.

## Running the project

Requirements: Node 18+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

## Stack & why

- **Vite + React 18 + TypeScript** — fast tooling, typed domain model.
- **CSS Modules + design tokens** (CSS custom properties in `src/styles/global.css`) — every color, radius and type size is sampled from the Figma once and consumed everywhere. No UI framework: the design is fully custom, and matching it pixel-for-pixel is cleaner without fighting a library's defaults.
- **Context + `useReducer`** — the state is one small object; a state library would be over-engineering at this size.

## Architecture

```
src/
├── data/
│   ├── catalog.json        # products, plans, steps, config, seed — single source of truth
│   └── catalog.ts          # one-time lookup indexes (by id, by step, SKU order)
├── types.ts                # domain entities (Product, Plan) + cart contract (LineItem)
├── state/BundleContext.tsx # reducer + provider + hooks
├── lib/
│   ├── projection.ts       # toLineItems: domain -> cart, the ONLY entity-aware layer
│   ├── pricing.ts          # pure math over LineItems: totals, shipping, savings, financing
│   ├── persistence.ts      # localStorage save/load with defensive validation
│   └── format.ts           # Intl currency formatting
└── components/
    ├── ui/                 # QuantityStepper, Price, Badge
    ├── builder/            # Builder, StepSection, ProductCard, PlanCard, VariantSelector
    └── review/             # ReviewPanel (lines, shipping, totals, checkout, save)
```

### Products and plans are separate domain entities

A product is shippable inventory sold per-unit; a plan is a recurring contract (`monthlyPrice`, `billingCycle`) that governs how you use the products — mirroring how Stripe and Shopify model subscriptions as distinct objects that still enter the cart as ordinary lines. The two meet in one place: `toLineItems()` in `lib/projection.ts` projects both into a shared **`LineItem`** row. Everything downstream — totals, savings, financing, the review panel — consumes `LineItem[]` only and never learns which lines were plans. Adding a new sellable kind (warranty, service) means extending the projection, not the consumers.

### Selection state matches selection semantics

- **Products** live in one quantity map keyed by SKU — `productId:variantId`, or bare `productId` for variant-less products. The card stepper and each review line read/write the same key, so card⇄review sync and per-variant isolation aren't features, they're consequences of the data structure: add 2 Black, switch the card to White, and the stepper reads 0 while Black ×2 stays in the review.
- **The plan** is exclusive, so it's a single `planId` slot. Choosing a plan is one O(1) assignment that *is* the deselection of the previous one — "two plans selected" is unrepresentable by shape, with no cleanup loop to get wrong. Plan cards accordingly use radio semantics (Select/Selected, `role="radio"`), not steppers.
- **Variant highlight vs stepper binding** are two different ids in `ProductCard`: `activeId` (which chip is lit — can be nothing on an empty card) and `bindingId` (which SKU the stepper writes to — falls back to the first variant). The reducer keeps `quantities` and `activeVariants` consistent in both directions: adding a variant promotes it to active; emptying a product's last variant clears its highlight, so a saved-then-restored empty card shows no stale selection.

### Built to scale reads

The catalog is immutable after import, so `data/catalog.ts` builds all lookup structures exactly once at module load — `productById`, `planById`, `stepById`, `productsByStep`, `skuOrder`. These are maps of *references* into the same JSON objects (new access paths, zero duplicated data), turning every hot-path lookup into O(1).

The projection then iterates the **selections**, not the catalog — O(selected) per recompute instead of O(catalog) — which is what keeps it safe for arbitrarily large catalogs. That direction has two costs, both paid explicitly: stale keys are validated out (a saved snapshot may reference products or variants that no longer exist — they're skipped, never rendered broken), and display order is restored with the precomputed `skuOrder` index, since a selection map's key order is click order, not catalog order.

At a real 1M-product scale the catalog would move server-side behind paginated per-step endpoints; `data/catalog.ts` is the seam where that swap happens without touching consumers.

## Pricing — how each number is computed

All money math lives in `lib/pricing.ts` as pure functions (same inputs → same outputs, no side effects), which keeps every rule below unit-testable.

### Line totals

`lineTotal = qty × unitPrice`; `lineCompareTotal = qty × unitCompareAt` (only when a compare-at price exists). A price of `0` renders as **FREE**; recurring lines carry `per: 'mo'` and render "$9.99/mo".

### Subtotal & savings

```
subtotal        = Σ qty × unitPrice            (all lines, incl. the plan's monthly price)
compareSubtotal = Σ qty × (unitCompareAt ?? unitPrice)
savings         = compareSubtotal − subtotal   → the green "Congrats!" message
```

### Free-shipping threshold

Shipping is **derived from the subtotal** rather than modeled as a line item, because it's a function of the cart, not a user selection:

```
freeShipping = subtotal ≥ config.shipping.freeThreshold    (currently $500)
shipping     = freeShipping ? 0 : config.shipping.price    ($5.99)
total        = subtotal + shipping
```

When earned, the shipping row renders the base price struck through (~~$5.99~~ **FREE**); until then the charge is shown and a hint tells the user how much more unlocks free shipping. The threshold and price are data in `catalog.json`, not code.

### Financing ("as low as $X/mo") — worked example

The purple chip is **live-computed** on every cart change with the standard amortized-installment formula (the same math behind Affirm-style financing), never hardcoded:

```
monthly = P × r × (1 + r)^n / ((1 + r)^n − 1)

P = total being financed
n = number of months        (config: 12)
r = monthly rate = APR / 12 (config APR: 0.3936 → r = 0.0328)
```

Worked through with the Figma's total, **P = $187.89**:

```
(1 + r)^n   = 1.0328^12               ≈ 1.4730
numerator   = 187.89 × 0.0328 × 1.4730 ≈ 9.077
denominator = 1.4730 − 1               = 0.4730
monthly     = 9.077 / 0.4730           ≈ $19.19   ✓ the design's chip
```

Sanity check on what the rate means: 12 × $19.19 = $230.28 repaid on a $187.89 purchase — the difference is the finance charge implied by the APR. Because the formula is live, any other total reprices correctly (a $215.86 cart renders ≈ $22.05/mo). Edge cases are handled: a non-positive total yields $0, and a 0% APR degrades to simple division `P / n`.

**Where 0.3936 came from:** the Figma shows the chip's *result* but not its inputs, so the APR was reverse-engineered — it's the rate at which the design's own total produces the design's own $19.19/mo — and stored as config. The code comments say so explicitly, so no future reader mistakes it for a real business rate.

## Design details & decisions

- **Two Figma inconsistencies found and resolved:**
  1. One desktop frame labels Step 1's button "Next: Choose your **sensors**" while the step order (and the other frame) implies "Next: Choose your **plan**". I followed the step order.
  2. The review panel's Cam Pan v3 line ($57.98 → $47.98 at qty 2) doesn't equal 2 × the card's unit price ($39.98 → $34.98). I treated **card prices as canonical** and compute all line totals as `qty × unit price`. Notably, the savings callout still lands on the design's exact **$50.92** either way. If review prices were the intended source of truth, it's a one-line change in `catalog.json`.
- **"N selected" counts distinct products**, not units — Cam v4 in two colors counts once (`totalQty > 0` per product, filter-and-count per step; the plan step counts its slot: 0 or 1).
- **Responsive per the frames:** selected counts show on collapsed steps on mobile but only on the open step on desktop; the plan group is labeled "Plan" on desktop and "Home monitoring plan" on mobile — both behind the 1024px breakpoint.
- **Review lines show the variant as a muted suffix** ("· White") — not in the mock, but without it two lines of the same product would be indistinguishable.
- **Accordion separators** follow a single-owner rule: the line between steps belongs to the section *below* it (`.section + .section`), so the open step's elevated lavender panel clears its own edges (`border-top-color: transparent` on itself and its next sibling) with no seam hacks.
- **Checkout is a placeholder** by design — it confirms the action and the computed total without pretending to process anything.

## Accessibility

- Accordion headers are real `<button>`s inside headings with `aria-expanded`/`aria-controls`; panels are `role="region"`.
- The variant selector is a `radiogroup` with roving tabindex and arrow-key navigation, and supports a no-selection state (the first chip becomes the tab stop). Plan cards form a radiogroup with `aria-checked`.
- Steppers are labelled groups ("Quantity of Wyze Cam v4, White") with `aria-live` values; struck-through prices carry visually-hidden "Original price / Now" context; the grand total announces changes politely.
- Decorative images use empty `alt`; the guarantee seal image carries its message as alt text. Visible `:focus-visible` styles throughout; `prefers-reduced-motion` respected.

## Persistence

"Save my system for later" is **explicit** (a deliberate click, never auto-save), matching the brief's configure → save → leave → return flow. It writes `{ savedAt, snapshot }` to `localStorage`, where the snapshot is the user's *inputs* only — `quantities`, `planId`, `activeVariants`, `openStepId`. Derived data (line items, totals) is never stored; it's recomputed from the snapshot.

On return, `loadSnapshot()` validates the payload field-by-field inside a `try/catch`: absent, corrupted, hand-edited, or wrong-shaped data all collapse to `null`, and the app falls back to the seed. The worst case is a fresh start — never a crash in the first render. The projection adds a second line of defense by dropping any restored keys that no longer resolve against the catalog.
