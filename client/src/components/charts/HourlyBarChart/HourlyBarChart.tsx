'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card/Card';
import { getIntensityColor, formatHour } from '@/lib/utils';
import type { HourlyStats } from '@/types';
import styles from './HourlyBarChart.module.css';

interface HourlyBarChartProps {
  data: HourlyStats[];
  isLoading?: boolean;
  error?: string | null;
}

export function HourlyBarChart({ data, isLoading = false, error = null }: HourlyBarChartProps) {
  const hasData = data.some((item) => item.count > 0);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>24-hour profile</h2>
        <p>Volume by hour, colored by average intensity</p>
      </div>

      {isLoading && <div className={styles.state}>Loading hourly profile...</div>}
      {!isLoading && error && <div className={styles.state}>{error}</div>}
      {!isLoading && !error && !hasData && <div className={styles.state}>No hourly data yet</div>}

      {!isLoading && !error && hasData && (
        <div className={styles.chart} aria-label="Hourly report distribution chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => (Number(hour) % 4 === 0 ? formatHour(Number(hour)) : '')}
                tickLine={false}
                axisLine={false}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                labelFormatter={(hour) => formatHour(Number(hour))}
                formatter={(value, name, item) => {
                  if (name === 'count') return [value, 'Reports'];
                  return [
                    (item.payload as HourlyStats).avgIntensity.toFixed(1),
                    'Avg intensity',
                  ];
                }}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                }}
              />
              <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                {data.map((item) => (
                  <Cell key={item.hour} fill={item.avgIntensity ? getIntensityColor(item.avgIntensity) : 'var(--border-strong)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
