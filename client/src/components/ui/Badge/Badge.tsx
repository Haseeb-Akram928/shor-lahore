import type { HTMLAttributes } from 'react';
import { cx } from '@/lib/utils';
import styles from './Badge.module.css';

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span {...props} className={cx(styles.badge, styles[tone], className)} />;
}
