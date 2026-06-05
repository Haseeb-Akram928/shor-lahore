import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from '@/lib/utils';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface BaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  isLoading?: boolean;
  className?: string;
}

type NativeButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: false;
};

type LinkButtonProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
  asChild: true;
  href: string;
};

export function Button(props: NativeButtonProps | LinkButtonProps) {
  const { children, variant = 'primary', isLoading = false, className } = props;
  const classes = cx(styles.button, styles[variant], isLoading && styles.loading, className);

  if (props.asChild) {
    const { asChild: _asChild, href, ...linkProps } = props;
    return (
      <Link {...linkProps} href={href} className={classes} aria-disabled={isLoading || linkProps['aria-disabled']}>
        {isLoading && <Loader2 size={16} className={styles.spinner} aria-hidden="true" />}
        <span>{children}</span>
      </Link>
    );
  }

  const { asChild: _asChild, disabled, type = 'button', ...buttonProps } = props;
  return (
    <button {...buttonProps} type={type} disabled={disabled || isLoading} className={classes}>
      {isLoading && <Loader2 size={16} className={styles.spinner} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
