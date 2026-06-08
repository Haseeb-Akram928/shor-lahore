'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/Badge/Badge';
import { Card } from '@/components/ui/Card/Card';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import type { NoiseTypeBreakdown } from '@/types';
import styles from './NoiseTypePieChart.module.css';

interface NoiseTypePieChartProps {
  data: NoiseTypeBreakdown[];
  isLoading?: boolean;
  error?: string | null;
}

export function NoiseTypePieChart({ data, isLoading = false, error = null }: NoiseTypePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const hasData = total > 0;

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Noise mix</h2>
        <p>Reports grouped by type</p>
      </div>

      {isLoading && <div className={styles.state}>Loading noise mix...</div>}
      {!isLoading && error && <div className={styles.state}>{error}</div>}
      {!isLoading && !error && !hasData && <div className={styles.state}>No noise type data yet</div>}

      {!isLoading && !error && hasData && (
        <>
          <div className={styles.chart} aria-label="Noise type donut chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="type"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {data.map((item) => (
                    <Cell key={item.type} fill={NOISE_TYPE_CONFIG[item.type].color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => [
                    formatNumber(Number(value)),
                    NOISE_TYPE_CONFIG[(item.payload as NoiseTypeBreakdown).type].label,
                  ]}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.center}>
              <strong>{formatNumber(total)}</strong>
              <span>reports</span>
            </div>
          </div>

          <div className={styles.legend}>
            {data.slice(0, 5).map((item) => (
              <Badge key={item.type} className={styles.badge}>
                <span style={{ background: NOISE_TYPE_CONFIG[item.type].color }} aria-hidden="true" />
                {NOISE_TYPE_CONFIG[item.type].label} {item.percentage}%
              </Badge>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
