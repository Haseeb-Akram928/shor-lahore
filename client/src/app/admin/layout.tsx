import { AdminAccessGate } from '@/components/admin/AdminAccessGate/AdminAccessGate';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar/DashboardSidebar';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccessGate>
      <div className={styles.shell}>
        <DashboardSidebar />
        <div className={styles.content}>{children}</div>
      </div>
    </AdminAccessGate>
  );
}
