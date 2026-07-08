import { useMemo, useState } from 'react';
import { useBundle } from '../../state/BundleContext';
import { toLineItems } from '../../lib/projection';
import { financingMonthly, lineCompareTotal, lineTotal, totals } from '../../lib/pricing';
import { money } from '../../lib/format';
import type { LineItem } from '../../types';
import { Price } from '../ui/Price';
import { QuantityStepper } from '../ui/QuantityStepper';
import styles from './ReviewPanel.module.css';
import truck from '../../assets/images/truck.png';
import guaranteeSeal from '../../assets/images/guaranteeSeal.png';

function ReviewLine({ line }: { line: LineItem }) {
  const { setQuantity } = useBundle();
  const isPlan = line.ref.kind === 'plan';
  const label = line.variantLabel ? `${line.name}, ${line.variantLabel}` : line.name;

  return (
    <li className={styles.line}>
      {isPlan ? (
        <span className={styles.planLogo}>
          <span className={styles.planLogoMark}>wyze</span>
          <span className={styles.planLogoName}>
            {line.name.split(' ')[0]} <strong>{line.name.split(' ').slice(1).join(' ')}</strong>
          </span>
        </span>
      ) : (
        <>
          <span className={styles.thumb}>
            <img src={line.image} alt="" width="34" height="34" loading="lazy" />
          </span>
          <span className={styles.lineName}>
            {line.name}
            {line.variantLabel && <span className={styles.variantTag}> · {line.variantLabel}</span>}
          </span>
        </>
      )}

      {!isPlan && (
        <QuantityStepper
          size="sm"
          value={line.qty}
          onChange={(next) => setQuantity(line.key, next)}
          itemLabel={label}
        />
      )}

      <span className={styles.linePrice}>
        <Price
          amount={lineTotal(line)}
          compareAt={lineCompareTotal(line)}
          per={line.per}
          tone="review"
          stacked
        />
      </span>
    </li>
  );
}

export function ReviewPanel() {
  const { catalog, state, saveForLater } = useBundle();
  const [checkoutMessage, setCheckoutMessage] = useState(false);

  const { config } = catalog;
  const lines = useMemo(() => toLineItems(state), [state]);
  const t = useMemo(() => totals(lines, config.shipping), [lines, config.shipping]);
  const monthly = financingMonthly(t.total, config.financing.months, config.financing.apr);
  const isEmpty = lines.length === 0;

  return (
    <aside className={styles.panel} aria-labelledby="review-title">
      <p className={`eyebrow ${styles.eyebrow}`}>Review</p>
      <h2 id="review-title" className={styles.title}>
        Your security system
      </h2>
      <p className={styles.subtitle}>
        Review your personalized protection system designed to keep what matters most safe.
      </p>

      {isEmpty ? (
        <p className={styles.empty}>
          Your system is empty. Open a step on the left and add cameras, sensors or a plan to see
          it here.
        </p>
      ) : (
        catalog.categories.map((category) => {
          const groupLines = lines.filter((l) => l.category === category.id);
          if (groupLines.length === 0) return null;
          return (
            <section key={category.id} className={styles.group} aria-label={category.label}>
              <h3 className={styles.groupLabel}>
                <span className={styles.desktopOnly}>{category.label}</span>
                <span className={styles.mobileOnly}>{category.mobileLabel}</span>
              </h3>
              <ul className={styles.lines}>
                {groupLines.map((line) => (
                  <ReviewLine key={line.key} line={line} />
                ))}
              </ul>
            </section>
          );
        })
      )}

      <div className={styles.shippingRow}>
        <span className="shippingIcon">
        <img src={truck} alt="My SVG truck" width={41} height={41}/>

        </span>
        <span className={styles.shippingLabel}>{config.shipping.label}</span>
        <Price
          amount={t.shipping}
          compareAt={t.shippingCompareAt}
          tone="review"
          stacked
        />
      </div>

      {!isEmpty && !t.freeShipping && (
        <p className={styles.shippingHint}>
          Add {money(config.shipping.freeThreshold - t.subtotal)} more for free shipping
        </p>
      )}

      <div className={styles.totalsRow}>
        <img src={guaranteeSeal} alt={config.guarantee.seal} width={78} height={78} />
        <div className={styles.totalsCol}>
          <p className={styles.financing}>
            {config.financing.prefix} {money(monthly)}/mo
          </p>
          <p className={styles.total}>
            {t.compareTotal > t.total && (
              <s className={styles.totalCompare}>
                <span className="visually-hidden">Before discounts </span>
                {money(t.compareTotal)}
              </s>
            )}
            <span className={styles.totalCurrent} aria-live="polite">
              <span className="visually-hidden">Total </span>
              {money(t.total)}
            </span>
          </p>
        </div>
      </div>

      {t.savings > 0 && (
        <p className={styles.savings} aria-live="polite">
          {config.savingsMessage.replace('{amount}', money(t.savings))}
        </p>
      )}

      <button
        type="button"
        className={styles.checkout}
        disabled={isEmpty}
        onClick={() => setCheckoutMessage(true)}
      >
        Checkout
      </button>
      {checkoutMessage && (
        <p className={styles.status} role="status">
          Checkout isn&rsquo;t wired up in this prototype — your {money(t.total)} system is ready
          to go, though.
        </p>
      )}

      <p className={styles.saveRow}>
        <button type="button" className={styles.saveLink} onClick={saveForLater}>
          Save my system for later
        </button>
      </p>
      {state.savedAt && (
        <p className={styles.status} role="status">
          System saved — it will be restored on your next visit.
        </p>
      )}
    </aside>
  );
}
