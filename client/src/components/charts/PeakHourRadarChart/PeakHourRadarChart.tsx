'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/Card/Card';
import { formatHour } from '@/lib/utils';
import type { HourlyStats } from '@/types';
import styles from './PeakHourRadarChart.module.css';

interface PeakHourRadarChartProps {
  data: HourlyStats[];
  isLoading?: boolean;
  error?: string | null;
}

export function PeakHourRadarChart({ data, isLoading = false, error = null }: PeakHourRadarChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatHour(item.hour),
  }));
  const hasData = data.some((item) => item.count > 0);

  return (
    <Card className={styles.card}>
      <h2>Peak-hour radar</h2>
      <p>Report density across the day</p>
      {isLoading && <div className={styles.state}>Loading radar...</div>}
      {!isLoading && error && <div className={styles.state}>{error}</div>}
      {!isLoading && !error && !hasData && <div className={styles.state}>No radar data yet</div>}
      {!isLoading && !error && hasData && (
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: 'var(--text-soft)', fontSize: 10 }} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                }}
              />
              <Radar dataKey="count" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.28} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
