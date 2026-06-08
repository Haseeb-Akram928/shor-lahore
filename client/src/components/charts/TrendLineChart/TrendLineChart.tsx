'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card/Card';
import type { TrendPoint } from '@/types';
import styles from './TrendLineChart.module.css';

interface TrendLineChartProps {
  data: TrendPoint[];
  isLoading?: boolean;
  error?: string | null;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
};

export function TrendLineChart({ data, isLoading = false, error = null }: TrendLineChartProps) {
  const hasData = data.some((point) => point.count > 0);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2>Report trend</h2>
          <p>Daily reports over the selected period</p>
        </div>
      </div>

      {isLoading && <div className={styles.state}>Loading trend...</div>}
      {!isLoading && error && <div className={styles.state}>{error}</div>}
      {!isLoading && !error && !hasData && <div className={styles.state}>No trend data yet</div>}

      {!isLoading && !error && hasData && (
        <div className={styles.chart} aria-label="Daily report trend chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.38} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                labelFormatter={(label) => formatDate(String(label))}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--brand)"
                strokeWidth={3}
                fill="url(#trendFill)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
