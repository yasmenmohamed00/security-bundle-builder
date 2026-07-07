import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { BundleState, Catalog, Product } from '../types';
import { productById, catalog } from '../data/catalog';
import { loadSnapshot, saveSnapshot } from '../lib/persistence';
import { selectionKey } from '../lib/pricing';


type Action =
  | { type: 'SET_QTY'; key: string; qty: number }
  | { type: 'CHOOSE_PLAN'; planId: string }
  | { type: 'SELECT_VARIANT'; productId: string; variantId: string }
  | { type: 'TOGGLE_STEP'; stepId: string }
  | { type: 'OPEN_STEP'; stepId: string }
  | { type: 'MARK_SAVED'; savedAt: string };

function clampQty(qty: number): number {
  const min = 0;
  return Math.max(min, Math.floor(qty));
}

function reducer(state: BundleState, action: Action): BundleState {
  switch (action.type) {
    case 'SET_QTY': {
        const [productId] = action.key.split(':');
        const product = productById.get(productId);
        if (!product) return state;
      
        const qty = clampQty(action.qty);
        const quantities = { ...state.quantities };
        if (qty === 0) delete quantities[action.key];
        else quantities[action.key] = qty;
      
        // Keep activeVariants consistent with quantities — both directions:
        const activeVariants = { ...state.activeVariants };
        const variantId = action.key.includes(':') ? action.key.split(':')[1] : undefined;
      
        if (qty > 0 && variantId) {
          // adding/updating a variant makes it the active one (chip follows the action)
          activeVariants[productId] = variantId;
        } else if (qty === 0 && product.variants) {
          // if the product is now empty across ALL variants, clear its chip highlight
          const stillSelected = product.variants.some(
            (v) => (quantities[selectionKey(productId, v.id)] ?? 0) > 0,
          );
          if (!stillSelected) delete activeVariants[productId];
        }
      
        return { ...state, quantities, activeVariants };
      }
    case 'CHOOSE_PLAN':
      return { ...state, planId: action.planId };
    case 'SELECT_VARIANT':
      return {
        ...state,
        activeVariants: { ...state.activeVariants, [action.productId]: action.variantId },
      };
    case 'TOGGLE_STEP':
      return { ...state, openStepId: state.openStepId === action.stepId ? '' : action.stepId };
    case 'OPEN_STEP':
      return { ...state, openStepId: action.stepId };
    case 'MARK_SAVED':
      return { ...state, savedAt: action.savedAt };
    default:
      return state;
  }
}

/** Saved system wins over the seed; the seed reproduces the Figma's load state. */
function initialState(): BundleState {
  const stored = loadSnapshot();
  if (stored) return { ...stored.snapshot, savedAt: stored.savedAt };
  return {
    openStepId: catalog.seed.openStepId,
    quantities: { ...catalog.seed.quantities },
    planId: catalog.seed.planId,
    activeVariants: { ...catalog.seed.activeVariants },
    savedAt: null,
  };
}

interface BundleContextValue {
  catalog: Catalog;
  state: BundleState;
  setQuantity: (key: string, qty: number) => void;
  choosePlan: (planId: string) => void;
  selectVariant: (productId: string, variantId: string) => void;
  toggleStep: (stepId: string) => void;
  openStep: (stepId: string) => void;
  saveForLater: () => void;
  activeVariantId: (product: Product) => string | undefined;
}

const BundleContext = createContext<BundleContextValue | null>(null);

export function BundleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const value = useMemo<BundleContextValue>(
    () => ({
      catalog,
      state,
      setQuantity: (key, qty) => dispatch({ type: 'SET_QTY', key, qty }),
      choosePlan: (planId) => dispatch({ type: 'CHOOSE_PLAN', planId }),
      selectVariant: (productId, variantId) =>
        dispatch({ type: 'SELECT_VARIANT', productId, variantId }),
      toggleStep: (stepId) => dispatch({ type: 'TOGGLE_STEP', stepId }),
      openStep: (stepId) => dispatch({ type: 'OPEN_STEP', stepId }),
      saveForLater: () => {
        const savedAt = saveSnapshot({
          openStepId: state.openStepId,
          quantities: state.quantities,
          planId: state.planId,
          activeVariants: state.activeVariants,
        });
        dispatch({ type: 'MARK_SAVED', savedAt });
      },
      activeVariantId: (product) =>
      product.variants ? state.activeVariants[product.id] : undefined, 
    }),
    [state],
  );

  return <BundleContext.Provider value={value}>{children}</BundleContext.Provider>;
}

export function useBundle(): BundleContextValue {
  const ctx = useContext(BundleContext);
  if (!ctx) throw new Error('useBundle must be used inside <BundleProvider>');
  return ctx;
}
