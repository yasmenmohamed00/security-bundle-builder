import type { BundleSnapshot } from '../types';

const STORAGE_KEY = 'security-bundle-builder';

interface StoredPayload {
  savedAt: string;
  snapshot: BundleSnapshot;
}

/** Explicit save, triggered by "Save my system for later". */
export function saveSnapshot(snapshot: BundleSnapshot): string {
  const payload: StoredPayload = {
    savedAt: new Date().toISOString(),
    snapshot,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload.savedAt;
}

/** Restore on return visit; */
export function loadSnapshot(): { snapshot: BundleSnapshot; savedAt: string } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPayload;
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.snapshot !== 'object' || parsed.snapshot === null) {
      return null;
    }
    const { openStepId, quantities, planId, activeVariants } = parsed.snapshot;
    if (typeof openStepId !== 'string' || typeof quantities !== 'object') return null;
    if (planId !== null && typeof planId !== 'string') return null;
    return {
      snapshot: {
        openStepId,
        quantities: quantities ?? {},
        planId: planId ?? null,
        activeVariants: activeVariants ?? {},
      },
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}