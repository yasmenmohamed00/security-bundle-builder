import { price as formatPrice } from '../../lib/format';
import priceStyles from './Price.module.css';
import badgeStyles from './Badge.module.css';

interface PriceProps {
  amount: number;
  compareAt?: number;
  per?: 'mo';
  /** Cards use a red strike; the review panel uses grey + purple. */
  tone?: 'card' | 'review';
  /** Review lines stack compare-at above the current price. */
  stacked?: boolean;
}

export function Price({ amount, compareAt, per, tone = 'card', stacked = false }: PriceProps) {
  const showCompare = compareAt !== undefined && compareAt > amount;
  const isFree = amount === 0;

  return (
    <p className={`${priceStyles.price} ${stacked ? priceStyles.stacked : ''}`}>
      {showCompare && (
        <s
          className={`${priceStyles.compare} ${tone === 'card' ? priceStyles.compareDanger : ''}`}
        >
          <span className="visually-hidden">Original price </span>
          {formatPrice(compareAt, per)}
        </s>
      )}
      <span
        className={`${priceStyles.current} ${tone === 'review' ? priceStyles.currentAccent : ''} ${
          isFree ? priceStyles.free : ''
        }`}
      >
        {showCompare && <span className="visually-hidden">Now </span>}
        {isFree ? 'FREE' : formatPrice(amount, per)}
      </span>
    </p>
  );
}

export function Badge({ label }: { label: string }) {
  return <span className={badgeStyles.badge}>{label}</span>;
}
