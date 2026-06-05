import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...props },
  ref
) {
  const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <label className={styles.field} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <input
        {...props}
        id={inputId}
        ref={ref}
        className={cx(styles.input, error && styles.invalid, className)}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
      />
      {error && <span id={descriptionId} className={styles.error}>{error}</span>}
      {!error && hint && <span id={descriptionId} className={styles.hint}>{hint}</span>}
    </label>
  );
});
