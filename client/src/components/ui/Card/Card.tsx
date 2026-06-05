import type { HTMLAttributes } from 'react';
import { cx } from '@/lib/utils';
import styles from './Card.module.css';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx(styles.card, className)} />;
}
