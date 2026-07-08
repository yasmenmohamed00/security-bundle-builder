import { useBundle } from '../../state/BundleContext';
import { productsByStep } from '../../data/catalog';
import { stepSelectedCount } from '../../lib/projection';
import type { Step } from '../../types';
import styles from './StepSection.module.css';
import carrotUpIcon from '../../assets/images/carrot-up.svg';
import carrotDownIcon from '../../assets/images/carrot-down.svg';
import { PlanCard } from './PlanCard';
import { ProductCard } from './ProductCard';

import camera from '../../assets/images/camera.svg';
import shield from '../../assets/images/shield.svg';
import sensor from '../../assets/images/sensor.svg';
import grid from '../../assets/images/grid.svg';

interface StepSectionProps {
  step: Step;
  index: number;
  total: number;
}
export const stepIcons: Record<string, string> = { camera, shield, sensor, grid };

export function StepSection({ step, index, total }: StepSectionProps) {
  const { catalog, state, toggleStep, openStep } = useBundle();

  const open = state.openStepId === step.id;
  const selectedCount = stepSelectedCount(state, step);
  const nextStep = catalog.steps[index]; // the step after this one (index is 1-based display)
  const headerId = `step-header-${step.id}`;
  const panelId = `step-panel-${step.id}`;

  return (
    <section className={`${styles.section} ${open ? styles.open : ''}`} aria-labelledby={headerId}>
      <p className={`eyebrow ${styles.eyebrow}`}>
        Step {index} of {total}
      </p>

      <h2 className={styles.heading}>
        <button
          type="button"
          id={headerId}
          className={styles.headerButton}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => toggleStep(step.id)}
        >
          <span className={styles.iconWrap}>
            <img src={stepIcons[step.icon]} alt="" width={26} height={26} />
          </span>
          <span className={styles.title}>{step.title}</span>
          <span className={`${styles.indicator} ${selectedCount > 0 ? styles.hasCount : ''}`}>
            <span className={styles.count}>{selectedCount} selected</span>
            <img src={open ? carrotUpIcon : carrotDownIcon} alt="My SVG carrot" width={12} height={12}/>
          </span>
        </button>
      </h2>

      <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className={`${styles.collapse} ${open ? styles.expanded : ''}`}
        >
           <div className={styles.collapseInner}>
            <div className={styles.panel}></div>
              {step.source === 'plans' ? (
                <div className={styles.grid} role="radiogroup" aria-label={step.title}>
                  {catalog.plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              ) : (
                <div className={styles.grid}>
                  {(productsByStep.get(step.id) ?? []).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {step.nextLabel && nextStep && (
                <div className={styles.nextRow}>
                  <button type="button" className={styles.nextButton} onClick={() => openStep(nextStep.id)}>
                    {step.nextLabel}
                  </button>
                </div>
              )}
              </div>
      </div>
    </section>
  );
}
