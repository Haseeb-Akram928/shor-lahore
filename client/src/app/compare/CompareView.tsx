'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Clock, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Select } from '@/components/ui/Select/Select';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { formatHour, getIntensityColor } from '@/lib/utils';
import type { AnalyticsPeriod, ApiResponse, AreaComparison, District } from '@/types';
import styles from '../exploration.module.css';

const PERIODS: AnalyticsPeriod[] = ['7d', '30d', '90d', '1y', 'all'];

export function CompareView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<AreaComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDistricts() {
      try {
        const response = await api.get<ApiResponse<District[]>>('/districts');
        setDistricts(response.data);
      } catch {
        setDistricts([]);
      }
    }

    void loadDistricts();
  }, []);

  const districtIds = useMemo(() => {
    return selectedIds.length >= 2 ? selectedIds.join(',') : undefined;
  }, [selectedIds]);

  useEffect(() => {
    let isCurrent = true;

    async function loadComparison() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<ApiResponse<AreaComparison>>('/public/compare', { period, districtIds });
        if (isCurrent) setComparison(response.data);
      } catch (err) {
        if (isCurrent) setError(err instanceof Error ? err.message : 'Unable to compare areas');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadComparison();
    return () => {
      isCurrent = false;
    };
  }, [districtIds, period]);

  const toggleArea = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <div>
            <Badge tone="brand">Compare</Badge>
            <h1>Compare Lahore areas</h1>
            <p>Pick two or three mapped areas and compare their quiet score, hourly profile, report volume, and dominant noise source.</p>
          </div>
          <Select label="Period" value={period} onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}>
            {PERIODS.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </Select>
        </div>

        <div className={styles.filters} aria-label="Area comparison selection">
          {districts.map((district) => {
            const isSelected = selectedIds.includes(district._id);
            return (
              <Button
                key={district._id}
                variant={isSelected ? 'primary' : 'secondary'}
                onClick={() => toggleArea(district._id)}
                disabled={!isSelected && selectedIds.length >= 3}
                aria-pressed={isSelected}
              >
                {district.name}
              </Button>
            );
          })}
          <Button variant="ghost" onClick={() => setSelectedIds([])}>Use defaults</Button>
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {isLoading ? (
          <div className={styles.state}>Loading comparison...</div>
        ) : !comparison?.areas.length ? (
          <div className={styles.empty}>No area comparison data yet</div>
        ) : (
          <div className={styles.areaGrid}>
            {comparison.areas.map((area) => {
              const topConfig = area.topNoiseType ? NOISE_TYPE_CONFIG[area.topNoiseType] : null;
              return (
                <Card key={area.district._id} className={styles.areaCard}>
                  <Badge tone="brand">Quiet score {area.quietScore}</Badge>
                  <h2>{area.district.name}</h2>
                  <div className={styles.areaStats}>
                    <span><strong>{area.avgIntensity.toFixed(1)}</strong> avg intensity</span>
                    <span><strong>{area.totalReports}</strong> reports</span>
                    <span><strong>{area.peakHour === null ? 'N/A' : formatHour(area.peakHour)}</strong> peak hour</span>
                    <span><strong>{area.quietestHour === null ? 'N/A' : formatHour(area.quietestHour)}</strong> quietest</span>
                  </div>
                  <div className={styles.reportMeta}>
                    <span className={styles.pill}><Volume2 size={14} /> {topConfig?.label || 'No dominant source'}</span>
                    <span className={styles.pill}><BarChart3 size={14} /> {area.byType.length} sources</span>
                    <span className={styles.pill}><Clock size={14} /> 24h profile</span>
                  </div>
                  <div className={styles.miniBars} aria-label={`${area.district.name} hourly profile`}>
                    {area.hourly.filter((item) => item.hour % 2 === 0).map((item) => (
                      <span
                        key={item.hour}
                        className={styles.miniBar}
                        style={{
                          height: `${Math.max(8, item.count ? item.avgIntensity * 7 : 4)}px`,
                          background: item.avgIntensity ? getIntensityColor(item.avgIntensity) : 'var(--border)',
                        }}
                        title={`${formatHour(item.hour)}: ${item.avgIntensity.toFixed(1)}`}
                      />
                    ))}
                  </div>
                  <Button asChild href={`/districts/${area.district._id}`} variant="secondary">Open scorecard</Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
