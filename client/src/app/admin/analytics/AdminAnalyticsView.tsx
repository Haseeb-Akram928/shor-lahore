'use client';

import { useEffect, useState } from 'react';
import { DistrictRankChart } from '@/components/charts/DistrictRankChart/DistrictRankChart';
import { HourlyBarChart } from '@/components/charts/HourlyBarChart/HourlyBarChart';
import { IntensityHeatmapGrid } from '@/components/charts/IntensityHeatmapGrid/IntensityHeatmapGrid';
import { PeakHourRadarChart } from '@/components/charts/PeakHourRadarChart/PeakHourRadarChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart/TrendLineChart';
import { Button } from '@/components/ui/Button/Button';
import { api } from '@/lib/api';
import type { AnalyticsPeriod, ApiResponse, DistrictStats, HeatmapGridCell, HourlyStats, TrendPoint } from '@/types';
import styles from '../adminRoute.module.css';

const PERIODS: Array<{ label: string; value: AnalyticsPeriod }> = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
];

export function AdminAnalyticsView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [heatmap, setHeatmap] = useState<HeatmapGridCell[]>([]);
  const [hourly, setHourly] = useState<HourlyStats[]>([]);
  const [districts, setDistricts] = useState<DistrictStats[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [heatmapRes, hourlyRes, districtsRes, trendsRes] = await Promise.all([
          api.get<ApiResponse<HeatmapGridCell[]>>('/analytics/heatmap-grid', { period }),
          api.get<ApiResponse<HourlyStats[]>>('/analytics/by-hour', { period }),
          api.get<ApiResponse<DistrictStats[]>>('/analytics/by-district', { period }),
          api.get<ApiResponse<TrendPoint[]>>('/analytics/trends', { period }),
        ]);

        if (!isCurrent) return;
        setHeatmap(heatmapRes.data);
        setHourly(hourlyRes.data);
        setDistricts(districtsRes.data);
        setTrends(trendsRes.data);
      } catch (err) {
        if (!isCurrent) return;
        setError(err instanceof Error ? err.message : 'Unable to load analytics');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [period]);

  const panelError = error ? 'Unable to load this panel' : null;

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Deep dive</span>
          <h1>Analytics</h1>
          <p>Compare Lahore noise patterns by district, hour, trend, and intensity.</p>
        </div>
        <div className={styles.actions} aria-label="Analytics period">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              variant={item.value === period ? 'primary' : 'secondary'}
              onClick={() => setPeriod(item.value)}
              disabled={isLoading && item.value === period}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.panelGrid}>
        <div className={styles.wide}>
          <IntensityHeatmapGrid data={heatmap} isLoading={isLoading} error={panelError} />
        </div>
        <TrendLineChart data={trends} isLoading={isLoading} error={panelError} />
        <HourlyBarChart data={hourly} isLoading={isLoading} error={panelError} />
        <PeakHourRadarChart data={hourly} isLoading={isLoading} error={panelError} />
        <DistrictRankChart data={districts} isLoading={isLoading} error={panelError} />
      </div>
    </section>
  );
}
