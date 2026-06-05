import { DashboardSidebar } from '@/components/layout/DashboardSidebar/DashboardSidebar';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <DashboardSidebar />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
