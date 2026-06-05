import { BarChart3, Map, Table } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard/KPICard';
import styles from './page.module.css';

export const metadata = {
  title: 'Admin',
};

export default function AdminPage() {
  return (
    <section className={styles.page}>
      <div>
        <h1>Admin overview</h1>
        <p className="muted">Dashboard charts and live feeds are scheduled for Phase 5.</p>
      </div>
      <div className={styles.grid}>
        <KPICard title="Seeded reports" value={900} icon={Table} />
        <KPICard title="Districts" value={10} icon={Map} />
        <KPICard title="Analytics endpoints" value={8} icon={BarChart3} />
      </div>
    </section>
  );
}
