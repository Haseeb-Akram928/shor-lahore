import type { SelectHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';
import styles from './Select.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ label, error, id, className, children, ...props }: SelectProps) {
  const selectId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label className={styles.field} htmlFor={selectId}>
      <span className={styles.label}>{label}</span>
      <select
        {...props}
        id={selectId}
        className={cx(styles.select, error && styles.invalid, className)}
        aria-invalid={Boolean(error)}
      >
        {children}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
