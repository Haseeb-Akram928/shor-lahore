import type { HTMLAttributes } from 'react';
import { cx } from '@/lib/utils';
import styles from './Skeleton.module.css';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx(styles.skeleton, className)} aria-hidden="true" />;
}
