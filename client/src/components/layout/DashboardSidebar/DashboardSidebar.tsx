'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Gauge, LogOut, Map, Shield, Table, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { useAuth } from '@/hooks/useAuth';
import { cx } from '@/lib/utils';
import styles from './DashboardSidebar.module.css';

const items = [
  { href: '/admin', label: 'Overview', icon: Gauge },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/reports', label: 'Reports', icon: Table },
  { href: '/admin/districts', label: 'Areas', icon: Map },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>
          <Shield size={18} aria-hidden="true" />
        </span>
        <div>
          <strong>ShorLahore</strong>
          <Badge tone="brand">Admin</Badge>
        </div>
      </div>
      <nav aria-label="Dashboard navigation">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
          <Link key={href} href={href} className={cx(isActive && styles.active)} aria-current={isActive ? 'page' : undefined}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </Link>
          );
        })}
      </nav>
      <div className={styles.account}>
        <div className={styles.avatar} aria-hidden="true">
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className={styles.accountCopy}>
          <span>{user?.name || 'Admin'}</span>
          <small>{user?.email || 'Operations'}</small>
        </div>
        <button type="button" onClick={() => void logout()} aria-label="Sign out">
          <LogOut size={17} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
