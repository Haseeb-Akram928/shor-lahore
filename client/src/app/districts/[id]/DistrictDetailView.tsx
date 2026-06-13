'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { formatRelativeTime, getIntensityColor } from '@/lib/utils';
import type { ApiResponse, District, PaginatedApiResponse, RecentReport } from '@/types';
import styles from './districtDetail.module.css';

interface DistrictDetailViewProps {
  districtId: string;
}

export function DistrictDetailView({ districtId }: DistrictDetailViewProps) {
  const [district, setDistrict] = useState<District | null>(null);
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [districtRes, reportRes] = await Promise.all([
        api.get<ApiResponse<District[]>>('/districts'),
        api.get<PaginatedApiResponse<RecentReport>>(`/districts/${districtId}/reports`, { page, limit: 12 }),
      ]);
      setDistrict(districtRes.data.find((item) => item._id === districtId) || null);
      setReports(reportRes.data);
      setPages(reportRes.pagination.pages || 1);
      setTotal(reportRes.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load area reports');
    } finally {
      setIsLoading(false);
    }
  }, [districtId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const avgIntensity = useMemo(() => {
    if (reports.length === 0) return district?.avgNoiseLevel ?? 0;
    return reports.reduce((sum, report) => sum + report.intensity, 0) / reports.length;
  }, [district?.avgNoiseLevel, reports]);

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
            <h1>{district?.name || 'Area'}</h1>
            <p>{district?.city || 'Lahore'} noise activity, report history, and current intensity profile.</p>
          </div>
          <div className={styles.summary}>
            <span>
              <strong>{total}</strong>
              reports
            </span>
            <span>
              <strong>{avgIntensity.toFixed(1)}</strong>
              avg intensity
            </span>
          </div>
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className={styles.skeleton} />)}
          </div>
        ) : !district && !error ? (
          <Card className={styles.empty}>
            <strong>Area not found</strong>
            <span>This mapped area may have been removed.</span>
          </Card>
        ) : reports.length === 0 ? (
          <Card className={styles.empty}>
            <strong>No reports yet</strong>
            <span>New reports inside this mapped area will appear here.</span>
          </Card>
        ) : (
          <>
            <div className={styles.grid}>
              {reports.map((report) => {
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
                        {report.district || district?.name}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className={styles.pagination}>
              <Button variant="secondary" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <span>Page {page} of {pages}</span>
              <Button variant="secondary" disabled={page >= pages || isLoading} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
