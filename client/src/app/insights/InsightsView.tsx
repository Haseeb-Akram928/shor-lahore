'use client';

import { useEffect, useState } from 'react';
import { Activity, BarChart3, MapPin, Radio } from 'lucide-react';
import { DistrictRankChart } from '@/components/charts/DistrictRankChart/DistrictRankChart';
import { HourlyBarChart } from '@/components/charts/HourlyBarChart/HourlyBarChart';
import { NoiseTypePieChart } from '@/components/charts/NoiseTypePieChart/NoiseTypePieChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart/TrendLineChart';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { KPICard } from '@/components/ui/KPICard/KPICard';
import { Select } from '@/components/ui/Select/Select';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { formatHour, formatRelativeTime, getIntensityColor } from '@/lib/utils';
import type { AnalyticsPeriod, ApiResponse, PublicInsights } from '@/types';
import styles from '../exploration.module.css';

const PERIODS: AnalyticsPeriod[] = ['7d', '30d', '90d', '1y', 'all'];

const periodLabel: Record<AnalyticsPeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year',
  all: 'All time',
};

export function InsightsView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [data, setData] = useState<PublicInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<ApiResponse<PublicInsights>>('/public/insights', { period });
        if (isCurrent) setData(response.data);
      } catch (err) {
        if (isCurrent) setError(err instanceof Error ? err.message : 'Unable to load public insights');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [period]);

  const overview = data?.overview;
  const chartError = error ? 'Unable to load this panel' : null;

  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <div>
            <Badge tone="brand">Public insights</Badge>
            <h1>Lahore noise intelligence</h1>
            <p>Explore public noise trends, area rankings, hourly patterns, and recent reports without entering the admin dashboard.</p>
          </div>
          <div className={styles.actions}>
            <Select label="Period" value={period} onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}>
              {PERIODS.map((item) => <option key={item} value={item}>{periodLabel[item]}</option>)}
            </Select>
            <Button asChild href="/compare" variant="secondary">Compare areas</Button>
          </div>
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        <div className={styles.stack} aria-busy={isLoading}>
          <div className={styles.kpiGrid}>
            <KPICard title="Total reports" value={isLoading ? '...' : overview?.totalReports ?? 0} icon={BarChart3} />
            <KPICard title="Active today" value={isLoading ? '...' : overview?.activeToday ?? 0} icon={Radio} />
            <KPICard title="Avg intensity" value={isLoading ? '...' : overview?.avgIntensity.toFixed(1) ?? '0.0'} icon={Activity} />
            <KPICard title="Areas mapped" value={isLoading ? '...' : overview?.totalDistricts ?? 0} icon={MapPin} />
          </div>

          <div className={styles.panelGrid}>
            <TrendLineChart data={data?.trends ?? []} isLoading={isLoading} error={chartError} />
            <NoiseTypePieChart data={data?.byType ?? []} isLoading={isLoading} error={chartError} />
            <HourlyBarChart data={data?.byHour ?? []} isLoading={isLoading} error={chartError} />
            <DistrictRankChart data={data?.byDistrict ?? []} isLoading={isLoading} error={chartError} />
          </div>

          <div>
            <h2>Recent public reports</h2>
            {isLoading ? (
              <div className={styles.state}>Loading recent reports...</div>
            ) : !data?.recentReports.length ? (
              <div className={styles.empty}>No public reports yet</div>
            ) : (
              <div className={styles.reportGrid}>
                {data.recentReports.slice(0, 6).map((report) => {
                  const config = NOISE_TYPE_CONFIG[report.noiseType];
                  return (
                    <Card key={report._id} className={styles.reportCard}>
                      <h3>{config.label}</h3>
                      <p>{report.description || 'Community noise report'}</p>
                      <div className={styles.reportMeta}>
                        <span className={styles.pill} style={{ background: getIntensityColor(report.intensity), color: '#fff' }}>{report.intensity}/10</span>
                        <span>{report.district || 'Lahore'}</span>
                        <span>{formatHour(new Date(report.occurredAt).getHours())}</span>
                        <span>{formatRelativeTime(report.occurredAt)}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
