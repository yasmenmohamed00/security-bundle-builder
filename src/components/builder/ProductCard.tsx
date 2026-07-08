import { useBundle } from '../../state/BundleContext';
import { selectionKey, totalQty } from '../../lib/pricing';
import type { Product } from '../../types';
import { Badge, Price } from '../ui/Price';
import { QuantityStepper } from '../ui/QuantityStepper';
import styles from './ProductCard.module.css';
import { VariantSelector } from './VariantSelector';

/**
 * Fully data-driven card: badge, description, Learn More, variant selector and
 * compare-at price all render only when the product defines them.
 *
 * Two variant ids with different jobs:
 * - activeId  → which chip is HIGHLIGHTED (undefined = none, e.g. empty card)
 * - bindingId → which SKU the stepper WRITES to (falls back to the first
 *   variant so an empty card can still add; the reducer then promotes that
 *   variant to active on the first increment).
 */
export function ProductCard({ product }: { product: Product }) {
  const { state, setQuantity, selectVariant, activeVariantId } = useBundle();

  const activeId = activeVariantId(product);
  const bindingId = activeId ?? product.variants?.[0]?.id;
  const qty = state.quantities[selectionKey(product.id, bindingId)] ?? 0;
  const selected = totalQty(state, product) > 0;

  const variantLabel = product.variants?.find((v) => v.id === bindingId)?.label;
  const stepperLabel = variantLabel ? `${product.name}, ${variantLabel}` : product.name;

  return (
    <article className={`${styles.card} ${selected ? styles.selected : ''}`}>
      {product.badge && (
        <span className={styles.badge}>
          <Badge label={product.badge} />
        </span>
      )}

      <div className={styles.media}>
        <img src={product.image} alt="" width="120" height="120" loading="lazy" />
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{product.name}</h3>

        {product.description && (
          <p className={styles.description}>
            {product.description}{' '}
            {product.learnMoreUrl && (
              <a className={styles.learnMore} href={product.learnMoreUrl}>
                Learn More<span className="visually-hidden"> about {product.name}</span>
              </a>
            )}
          </p>
        )}

        {product.variants && (
          <VariantSelector
            product={product}
            activeVariantId={activeId}
            onSelect={(id) => selectVariant(product.id, id)}
          />
        )}

        <div className={styles.footer}>
          <QuantityStepper
            value={qty}
            onChange={(next) => setQuantity(selectionKey(product.id, bindingId), next)}
            itemLabel={stepperLabel}
          />
          <Price amount={product.price} compareAt={product.compareAtPrice} />
        </div>
      </div>
    </article>
  );
}