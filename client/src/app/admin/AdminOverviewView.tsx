'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, BarChart3, MapPin, Radio, Volume2 } from 'lucide-react';
import { HourlyBarChart } from '@/components/charts/HourlyBarChart/HourlyBarChart';
import { LiveFeed } from '@/components/admin/LiveFeed/LiveFeed';
import { NoiseTypePieChart } from '@/components/charts/NoiseTypePieChart/NoiseTypePieChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart/TrendLineChart';
import { KPICard } from '@/components/ui/KPICard/KPICard';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api, ApiClientError } from '@/lib/api';
import type {
  AnalyticsPeriod,
  ApiResponse,
  HourlyStats,
  NoiseTypeBreakdown,
  OverviewStats,
  RecentReport,
  TrendPoint,
} from '@/types';
import styles from './page.module.css';

const PERIODS: Array<{ label: string; value: AnalyticsPeriod }> = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
];

interface AdminOverviewData {
  overview: OverviewStats | null;
  trends: TrendPoint[];
  byType: NoiseTypeBreakdown[];
  byHour: HourlyStats[];
  recent: RecentReport[];
}

const EMPTY_DATA: AdminOverviewData = {
  overview: null,
  trends: [],
  byType: [],
  byHour: [],
  recent: [],
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError || error instanceof Error) return error.message;
  return 'Dashboard data could not be loaded';
};

export function AdminOverviewView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [data, setData] = useState<AdminOverviewData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [overview, trends, byType, byHour, recent] = await Promise.all([
          api.get<ApiResponse<OverviewStats>>('/analytics/overview', { period }),
          api.get<ApiResponse<TrendPoint[]>>('/analytics/trends', { period }),
          api.get<ApiResponse<NoiseTypeBreakdown[]>>('/analytics/by-type', { period }),
          api.get<ApiResponse<HourlyStats[]>>('/analytics/by-hour', { period }),
          api.get<ApiResponse<RecentReport[]>>('/analytics/recent'),
        ]);

        if (!isCurrent) return;
        setData({
          overview: overview.data,
          trends: trends.data,
          byType: byType.data,
          byHour: byHour.data,
          recent: recent.data,
        });
      } catch (err) {
        if (!isCurrent) return;
        setError(getErrorMessage(err));
        setData(EMPTY_DATA);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [period]);

  const kpis = useMemo(() => {
    const overview = data.overview;
    const topNoiseType = overview?.topNoiseType.type || 'other';
    const topNoiseLabel = NOISE_TYPE_CONFIG[topNoiseType].label;
    const TopNoiseIcon = NOISE_TYPE_CONFIG[topNoiseType].icon;

    return [
      {
        title: 'Total reports',
        value: overview?.totalReports ?? 0,
        icon: BarChart3,
        change: overview?.totalReportsChange,
      },
      {
        title: 'Active today',
        value: overview?.activeToday ?? 0,
        icon: Radio,
      },
      {
        title: 'Avg intensity',
        value: overview ? overview.avgIntensity.toFixed(1) : '0.0',
        icon: Activity,
        change: overview?.avgIntensityChange,
      },
      {
        title: 'Top noise type',
        value: overview ? `${topNoiseLabel} (${overview.topNoiseType.count})` : topNoiseLabel,
        icon: TopNoiseIcon || Volume2,
      },
    ];
  }, [data.overview]);

  const chartError = error ? 'Unable to load this panel' : null;
  const miniMapReports = useMemo(() => {
    return data.recent
      .filter((report) => Array.isArray(report.location?.coordinates))
      .slice(0, 18)
      .map((report) => {
        const [lng, lat] = report.location.coordinates;
        const left = Math.max(4, Math.min(96, ((lng - 73.8) / 1) * 100));
        const top = Math.max(4, Math.min(96, (1 - ((lat - 31.2) / 0.6)) * 100));
        return { report, left, top };
      });
  }, [data.recent]);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>City operations</span>
          <h1>Admin overview</h1>
          <p>Monitor reporting volume, intensity patterns, and live public submissions.</p>
        </div>
        <div className={styles.periods} aria-label="Analytics period">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={item.value === period ? styles.activePeriod : undefined}
              onClick={() => setPeriod(item.value)}
              disabled={isLoading && item.value === period}
              aria-pressed={item.value === period}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.grid} aria-busy={isLoading}>
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={isLoading ? '...' : kpi.value}
            icon={kpi.icon}
            change={isLoading ? undefined : kpi.change}
          />
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.trendPanel}>
          <TrendLineChart data={data.trends} isLoading={isLoading} error={chartError} />
        </div>
        <NoiseTypePieChart data={data.byType} isLoading={isLoading} error={chartError} />
        <HourlyBarChart data={data.byHour} isLoading={isLoading} error={chartError} />
        <LiveFeed reports={data.recent} isLoading={isLoading} error={chartError} />
        <Link className={styles.miniMapPanel} href="/map" aria-label="Open the live noise map">
          <div className={styles.panelHeader}>
            <div>
              <h2>Recent report map</h2>
              <span>{miniMapReports.length} plotted reports</span>
            </div>
            <span className={styles.panelAction}>
              View map
              <MapPin size={18} />
            </span>
          </div>
          {isLoading ? (
            <div className={styles.mapState}>Loading map points...</div>
          ) : chartError ? (
            <div className={styles.mapState}>{chartError}</div>
          ) : miniMapReports.length === 0 ? (
            <div className={styles.mapState}>No recent reports to map</div>
          ) : (
            <div className={styles.miniMap} aria-label="Recent report coordinate preview">
              <span className={styles.mapLabel}>Lahore</span>
              {miniMapReports.map(({ report, left, top }) => {
                const config = NOISE_TYPE_CONFIG[report.noiseType];
                return (
                  <span
                    key={report._id}
                    className={styles.mapDot}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      background: config.color,
                      color: config.color,
                      width: `${Math.max(9, report.intensity + 6)}px`,
                      height: `${Math.max(9, report.intensity + 6)}px`,
                    }}
                    title={`${config.label}: ${report.intensity}/10`}
                  />
                );
              })}
            </div>
          )}
        </Link>
      </div>
    </section>
  );
}
