import { useBundle } from '../../state/BundleContext';
import type { Plan } from '../../types';
import { Badge, Price } from '../ui/Price';
import cardStyles from './ProductCard.module.css';
import styles from './PlanCard.module.css';

/**
 * Plans are a choice, not a quantity: the card renders radio semantics
 * (one Select control) instead of a stepper. Choosing writes the single
 * planId slot — the previous plan is deselected by the assignment itself.
 */
export function PlanCard({ plan }: { plan: Plan }) {
  const { state, choosePlan } = useBundle();
  const selected = state.planId === plan.id;

  return (
    <article className={`${cardStyles.card} ${selected ? cardStyles.selected : ''}`}>
      {plan.badge && (
        <span className={cardStyles.badge}>
          <Badge label={plan.badge} />
        </span>
      )}

      <div className={cardStyles.media}>
        <img src={plan.image} alt="" width="120" height="120" loading="lazy" />
      </div>

      <div className={cardStyles.body}>
        <h3 className={cardStyles.title}>{plan.name}</h3>

        {plan.description && (
          <p className={cardStyles.description}>
            {plan.description}{' '}
            {plan.learnMoreUrl && (
              <a className={cardStyles.learnMore} href={plan.learnMoreUrl}>
                Learn More<span className="visually-hidden"> about {plan.name}</span>
              </a>
            )}
          </p>
        )}

        <div className={cardStyles.footer}>
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${styles.select} ${selected ? styles.isSelected : ''}`}
            onClick={() => choosePlan(plan.id)}
          >
            {selected ? 'Selected' : 'Select'}
            <span className="visually-hidden"> {plan.name} plan</span>
          </button>
          <Price amount={plan.monthlyPrice} compareAt={plan.compareAtMonthlyPrice} per="mo" />
        </div>
      </div>
    </article>
  );
}
