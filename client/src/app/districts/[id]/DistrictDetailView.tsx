'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Clock, MapPin, ShieldCheck, Volume2 } from 'lucide-react';
import { HourlyBarChart } from '@/components/charts/HourlyBarChart/HourlyBarChart';
import { NoiseTypePieChart } from '@/components/charts/NoiseTypePieChart/NoiseTypePieChart';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { formatHour, formatRelativeTime, getIntensityColor } from '@/lib/utils';
import type { ApiResponse, AreaScorecard } from '@/types';
import styles from './districtDetail.module.css';

interface DistrictDetailViewProps {
  districtId: string;
}

export function DistrictDetailView({ districtId }: DistrictDetailViewProps) {
  const [scorecard, setScorecard] = useState<AreaScorecard | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<AreaScorecard>>(`/public/areas/${districtId}/scorecard`, { period });
      setScorecard(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load area scorecard');
    } finally {
      setIsLoading(false);
    }
  }, [districtId, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const topNoiseConfig = useMemo(() => {
    return scorecard?.topNoiseType ? NOISE_TYPE_CONFIG[scorecard.topNoiseType] : null;
  }, [scorecard?.topNoiseType]);

  return (
    <section className={styles.page}>
      <div className="container">
        <Button asChild href="/districts" variant="ghost" className={styles.backLink}>
          <ArrowLeft size={16} />
          Areas
        </Button>

        <div className={styles.header}>
          <div>
            <Badge tone="brand">Area profile</Badge>
            <h1>{scorecard?.district.name || 'Area'}</h1>
            <p>{scorecard?.district.city || 'Lahore'} quiet score, peak hours, noise mix, and recent public reports.</p>
          </div>
          <div className={styles.summary}>
            <span>
              <strong>{scorecard?.quietScore ?? 0}</strong>
              quiet score
            </span>
            <span>
              <strong>{scorecard?.avgIntensity.toFixed(1) ?? '0.0'}</strong>
              avg intensity
            </span>
          </div>
        </div>

        <div className={styles.actions} aria-label="Scorecard period">
          {(['7d', '30d', '90d', '1y', 'all'] as const).map((item) => (
            <Button
              key={item}
              variant={item === period ? 'primary' : 'secondary'}
              onClick={() => setPeriod(item)}
              disabled={isLoading && item === period}
            >
              {item.toUpperCase()}
            </Button>
          ))}
          <Button asChild href="/compare" variant="secondary">Compare</Button>
          <Button asChild href="/quiet-finder" variant="secondary">Quiet finder</Button>
          <Button asChild href="/map" variant="ghost">Open map</Button>
        </div>

        {scorecard && (
          <div className={styles.scoreGrid}>
            <Card className={styles.scoreCard}>
              <ShieldCheck size={20} />
              <strong>{scorecard.quietScore}</strong>
              <span>quiet score</span>
            </Card>
            <Card className={styles.scoreCard}>
              <BarChart3 size={20} />
              <strong>{scorecard.totalReports}</strong>
              <span>reports</span>
            </Card>
            <Card className={styles.scoreCard}>
              <Clock size={20} />
              <strong>{scorecard.peakHour === null ? 'N/A' : formatHour(scorecard.peakHour)}</strong>
              <span>peak noise</span>
            </Card>
            <Card className={styles.scoreCard}>
              <Clock size={20} />
              <strong>{scorecard.quietestHour === null ? 'N/A' : formatHour(scorecard.quietestHour)}</strong>
              <span>quietest hour</span>
            </Card>
            <Card className={styles.scoreCard}>
              <Volume2 size={20} />
              <strong>{topNoiseConfig?.label || 'N/A'}</strong>
              <span>top source</span>
            </Card>
          </div>
        )}

        {error && <div className={styles.error} role="alert">{error}</div>}

        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className={styles.skeleton} />)}
          </div>
        ) : !scorecard && !error ? (
          <Card className={styles.empty}>
            <strong>Area not found</strong>
            <span>This mapped area may have been removed.</span>
          </Card>
        ) : (
          <>
            {scorecard && (
              <div className={styles.insightStrip}>
                <span>
                  Lahore average <strong>{scorecard.lahoreAvgIntensity.toFixed(1)}</strong>
                </span>
                <span>
                  Difference <strong>{scorecard.comparisonToLahore >= 0 ? '+' : ''}{scorecard.comparisonToLahore.toFixed(1)}</strong>
                </span>
                <span>
                  {scorecard.comparisonToLahore <= 0 ? 'Quieter than Lahore average' : 'Louder than Lahore average'}
                </span>
              </div>
            )}

            <div className={styles.chartGrid}>
              <HourlyBarChart data={scorecard?.hourly ?? []} isLoading={isLoading} error={error ? 'Unable to load hourly data' : null} />
              <NoiseTypePieChart data={scorecard?.byType ?? []} isLoading={isLoading} error={error ? 'Unable to load noise mix' : null} />
            </div>

            {scorecard?.recentReports.length === 0 ? (
              <Card className={styles.empty}>
                <strong>No reports yet</strong>
                <span>New reports inside this mapped area will appear here.</span>
              </Card>
            ) : (
              <div className={styles.grid}>
                {scorecard?.recentReports.map((report) => {
                  const config = NOISE_TYPE_CONFIG[report.noiseType];
                  const Icon = config.icon;
                  return (
                    <Card key={report._id} className={styles.reportCard}>
                      <div className={styles.reportTop}>
                        <span className={styles.typeIcon} style={{ color: config.color }}>
                          <Icon size={18} />
                        </span>
                        <div>
                          <strong>{config.label}</strong>
                          <span>{formatRelativeTime(report.occurredAt)}</span>
                        </div>
                      </div>
                      <p>{report.description || 'Community noise report'}</p>
                      <div className={styles.reportMeta}>
                        <span className={styles.intensity} style={{ background: getIntensityColor(report.intensity) }}>
                          {report.intensity}/10
                        </span>
                        <span>
                          <MapPin size={14} />
                          {report.district || scorecard?.district.name}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
