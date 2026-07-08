import { useRef, type KeyboardEvent } from 'react';
import type { Product } from '../../types';
import styles from './VariantSelector.module.css';

interface VariantSelectorProps {
  product: Product;
  activeVariantId?: string;
  onSelect: (variantId: string) => void;
}

/** Swatch fills per variant id; falls back to a neutral chip. */
const SWATCHES: Record<string, string> = {
  white: '#f4f5f9',
  grey: '#9aa0b2',
  black: '#23262f',
};

/**
 * Radiogroup with arrow-key roving focus. Selecting a chip only changes which
 * variant the card's stepper is bound to — it never touches quantities.
 */
export function VariantSelector({ product, activeVariantId, onSelect }: VariantSelectorProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const variants = product.variants ?? [];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = variants.findIndex((v) => v.id === activeVariantId);
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const next = variants[(index + delta + variants.length) % variants.length];
    onSelect(next.id);
    groupRef.current
      ?.querySelector<HTMLButtonElement>(`[data-variant="${next.id}"]`)
      ?.focus();
  }

  return (
    <div
      ref={groupRef}
      className={styles.group}
      role="radiogroup"
      aria-label={`${product.name} color`}
      onKeyDown={onKeyDown}
    >
      {variants.map((variant) => {
        const active = variant.id === activeVariantId;
        return (
          <button
            key={variant.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-variant={variant.id}
            className={`${styles.chip} ${active ? styles.active : ''}`}
            onClick={() => onSelect(variant.id)}
          >
            <span
              className={styles.swatch}
              style={{ background: SWATCHES[variant.id] ?? '#d7dae6' }}
              aria-hidden="true"
            />
            {variant.label}
          </button>
        );
      })}
    </div>
  );
}
