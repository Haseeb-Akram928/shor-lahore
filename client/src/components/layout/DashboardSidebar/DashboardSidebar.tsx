import Link from 'next/link';
import { BarChart3, Gauge, Map, Table, Users } from 'lucide-react';
import styles from './DashboardSidebar.module.css';

const items = [
  { href: '/admin', label: 'Overview', icon: Gauge },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/reports', label: 'Reports', icon: Table },
  { href: '/admin/districts', label: 'Districts', icon: Map },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function DashboardSidebar() {
  return (
    <aside className={styles.sidebar}>
      <strong>Admin</strong>
      <nav aria-label="Dashboard navigation">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
