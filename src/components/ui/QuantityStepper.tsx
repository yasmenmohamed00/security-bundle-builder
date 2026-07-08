import styles from './QuantityStepper.module.css';
import minus from '../../assets/images/minus.svg';
import plus from '../../assets/images/plus.svg';


interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** Accessible name of the thing being counted, e.g. "Wyze Cam v4, White". */
  itemLabel: string;
  min?: number;
  size?: 'sm' | 'md';
}

/**
 * The single stepper used everywhere (cards + review lines). Both surfaces
 * write to the same store key, which is what keeps them in sync.
 */
export function QuantityStepper({
  value,
  onChange,
  itemLabel,
  size = 'md',
}: QuantityStepperProps) {


  return (
    <div className={`${styles.stepper} ${size === 'sm' ? styles.sm : ''}`} role="group" aria-label={`Quantity of ${itemLabel}`}>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease quantity of ${itemLabel}`}
      >
       <img src={minus} alt="My SVG miuns" width={20} height={20}/>

      </button>
      <span className={styles.value} aria-live="polite" aria-atomic="true">
        {value}
        <span className="visually-hidden"> of {itemLabel} selected</span>
      </span>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase quantity of ${itemLabel}`}
      >
        <img src={plus} alt="My SVG miuns" width={20} height={20}/>
      </button>
    </div>
  );
}
