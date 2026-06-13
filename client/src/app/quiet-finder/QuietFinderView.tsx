'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Clock, ShieldCheck, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Select } from '@/components/ui/Select/Select';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { formatHour } from '@/lib/utils';
import type {
  AnalyticsPeriod,
  ApiResponse,
  NoiseType,
  QuietFinderResponse,
  QuietFinderTimeWindow,
} from '@/types';
import styles from '../exploration.module.css';

const PERIODS: AnalyticsPeriod[] = ['7d', '30d', '90d', '1y', 'all'];
const TIME_WINDOWS: QuietFinderTimeWindow[] = ['any', 'morning', 'afternoon', 'evening', 'night'];
const noiseTypes = Object.keys(NOISE_TYPE_CONFIG) as NoiseType[];

export function QuietFinderView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [timeWindow, setTimeWindow] = useState<QuietFinderTimeWindow>('any');
  const [avoidType, setAvoidType] = useState<NoiseType | ''>('');
  const [maxIntensity, setMaxIntensity] = useState(6);
  const [data, setData] = useState<QuietFinderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rangeProgress = `${((maxIntensity - 1) / 9) * 100}%`;

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<ApiResponse<QuietFinderResponse>>('/public/quiet-finder', {
          period,
          timeWindow,
          avoidType: avoidType || undefined,
          maxIntensity,
        });
        if (isCurrent) setData(response.data);
      } catch (err) {
        if (isCurrent) setError(err instanceof Error ? err.message : 'Unable to find quiet areas');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [avoidType, maxIntensity, period, timeWindow]);

  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <div>
            <Badge tone="brand">Quiet finder</Badge>
            <h1>Find calmer Lahore areas</h1>
            <p>Rank mapped areas by expected intensity, time of day, and the noise source you want to avoid.</p>
          </div>
          <Button asChild href="/insights" variant="secondary">View insights</Button>
        </div>

        <div className={styles.filters}>
          <Select label="Period" value={period} onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}>
            {PERIODS.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </Select>
          <Select label="Time of day" value={timeWindow} onChange={(event) => setTimeWindow(event.target.value as QuietFinderTimeWindow)}>
            {TIME_WINDOWS.map((item) => <option key={item} value={item}>{item === 'any' ? 'Any time' : item}</option>)}
          </Select>
          <Select label="Avoid source" value={avoidType} onChange={(event) => setAvoidType(event.target.value as NoiseType | '')}>
            <option value="">Any source</option>
            {noiseTypes.map((type) => <option key={type} value={type}>{NOISE_TYPE_CONFIG[type].label}</option>)}
          </Select>
          <label className={styles.rangeField}>
            <span className={styles.rangeHeader}>
              <span>Max intensity</span>
              <span className={styles.rangeValue}>{maxIntensity}/10</span>
            </span>
            <input
              className={styles.rangeInput}
              type="range"
              min={1}
              max={10}
              value={maxIntensity}
              onChange={(event) => setMaxIntensity(Number(event.target.value))}
              style={{ '--range-progress': rangeProgress } as CSSProperties}
            />
          </label>
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {isLoading ? (
          <div className={styles.state}>Ranking quiet areas...</div>
        ) : !data?.results.length ? (
          <div className={styles.empty}>No quiet-area matches yet</div>
        ) : (
          <div className={styles.areaGrid}>
            {data.results.map((result) => (
              <Card key={result.district._id} className={styles.areaCard}>
                <Badge tone="brand">Quiet score {result.quietScore}</Badge>
                <h2>{result.district.name}</h2>
                <div className={styles.areaStats}>
                  <span><strong>{result.expectedIntensity.toFixed(1)}</strong> expected intensity</span>
                  <span><strong>{result.totalReports}</strong> reports</span>
                  <span><strong>{result.bestHour === null ? 'N/A' : formatHour(result.bestHour)}</strong> best hour</span>
                  <span><strong>{result.avoidedTypeCount}</strong> avoided-source reports</span>
                </div>
                <div className={styles.reportMeta}>
                  <span className={styles.pill}><ShieldCheck size={14} /> Ranked #{data.results.indexOf(result) + 1}</span>
                  <span className={styles.pill}><Clock size={14} /> {timeWindow}</span>
                  <span className={styles.pill}><Volume2 size={14} /> max {maxIntensity}/10</span>
                </div>
                <Button asChild href={`/districts/${result.district._id}`} variant="secondary">Open scorecard</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
