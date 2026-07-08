import { useBundle } from '../../state/BundleContext';
import { StepSection } from './StepSection';
import styles from './Builder.module.css';

export function Builder() {
  const { catalog } = useBundle();

  return (
    <div className={styles.builder}>
      <h1 className={styles.mobileTitle}>Let&rsquo;s get started!</h1>
      {catalog.steps.map((step, i) => (
        <StepSection key={step.id} step={step} index={i + 1} total={catalog.steps.length} />
      ))}
    </div>
  );
}
