'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card/Card';
import type { DistrictStats } from '@/types';
import styles from './DistrictRankChart.module.css';

interface DistrictRankChartProps {
  data: DistrictStats[];
  isLoading?: boolean;
  error?: string | null;
}

export function DistrictRankChart({ data, isLoading = false, error = null }: DistrictRankChartProps) {
  const rows = [...data].sort((a, b) => b.avgIntensity - a.avgIntensity).slice(0, 10);

  return (
    <Card className={styles.card}>
      <h2>Area ranking</h2>
      <p>Highest average intensity first</p>
      {isLoading && <div className={styles.state}>Loading areas...</div>}
      {!isLoading && error && <div className={styles.state}>{error}</div>}
      {!isLoading && !error && rows.length === 0 && <div className={styles.state}>No area data yet</div>}
      {!isLoading && !error && rows.length > 0 && (
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 12, right: 16, left: 36, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis type="category" dataKey="district" width={92} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                }}
              />
              <Bar dataKey="avgIntensity" fill="var(--brand)" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
