import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { formatNumber } from '@/lib/utils';
import styles from './KPICard.module.css';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  change?: number;
}

export function KPICard({ title, value, icon: Icon, change }: KPICardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span>{title}</span>
        <Icon size={20} />
      </div>
      <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
      {change !== undefined && (
        <span className={change >= 0 ? styles.positive : styles.negative}>
          {Math.abs(change).toFixed(1)}% from previous period
        </span>
      )}
    </Card>
  );
}
