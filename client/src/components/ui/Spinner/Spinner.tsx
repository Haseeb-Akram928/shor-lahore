import { Loader2 } from 'lucide-react';
import styles from './Spinner.module.css';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className={styles.spinner} role="status" aria-label={label}>
      <Loader2 size={20} />
    </span>
  );
}
