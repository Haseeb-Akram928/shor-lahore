'use client';

import { useEffect, useState } from 'react';
import { Award, FileText, MapPin, ThumbsUp } from 'lucide-react';
import { NoiseTypePieChart } from '@/components/charts/NoiseTypePieChart/NoiseTypePieChart';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { KPICard } from '@/components/ui/KPICard/KPICard';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { formatRelativeTime, getIntensityColor } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { ApiResponse, MyImpact } from '@/types';
import styles from '../exploration.module.css';

export function MyImpactView() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [data, setData] = useState<MyImpact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let isCurrent = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<ApiResponse<MyImpact>>('/users/me/impact');
        if (isCurrent) setData(response.data);
      } catch (err) {
        if (isCurrent) setError(err instanceof Error ? err.message : 'Unable to load impact');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, isAuthLoading]);

  if (!isAuthLoading && !isAuthenticated) {
    return (
      <section className={styles.page}>
        <div className="container">
          <Card className={styles.empty}>
            <Badge tone="brand">My impact</Badge>
            <h1>Login required</h1>
            <p>Your contribution summary is available after you sign in.</p>
            <Button asChild href="/login">Login</Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <div>
            <Badge tone="brand">My impact</Badge>
            <h1>{user?.name || data?.user.name || 'Your'} contribution</h1>
            <p>Track your reports, upvotes, reputation, and the Lahore areas you have helped map.</p>
          </div>
          <div className={styles.actions}>
            <Button asChild href="/report">Submit report</Button>
            <Button asChild href="/map" variant="secondary">Open map</Button>
          </div>
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        <div className={styles.stack} aria-busy={isLoading || isAuthLoading}>
          <div className={styles.kpiGrid}>
            <KPICard title="Reports" value={isLoading ? '...' : data?.totalReports ?? 0} icon={FileText} />
            <KPICard title="Upvotes" value={isLoading ? '...' : data?.totalUpvotes ?? 0} icon={ThumbsUp} />
            <KPICard title="Areas helped" value={isLoading ? '...' : data?.areasContributed ?? 0} icon={MapPin} />
            <KPICard title="Reputation" value={isLoading ? '...' : data?.user.reputation ?? 0} icon={Award} />
          </div>

          <div className={styles.panelGrid}>
            <NoiseTypePieChart data={data?.byType ?? []} isLoading={isLoading} error={error ? 'Unable to load this panel' : null} />
            <Card className={styles.areaCard}>
              <h2>Profile</h2>
              <div className={styles.areaStats}>
                <span><strong>{data?.user.role || user?.role || 'user'}</strong> role</span>
                <span><strong>{data?.user.reportsCount ?? user?.reportsCount ?? 0}</strong> account reports</span>
                <span><strong>{data?.user.reputation ?? user?.reputation ?? 0}</strong> reputation</span>
                <span><strong>{data?.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString('en-PK') : 'N/A'}</strong> joined</span>
              </div>
            </Card>
          </div>

          <div>
            <h2>Recent submissions</h2>
            {isLoading ? (
              <div className={styles.state}>Loading submissions...</div>
            ) : !data?.recentReports.length ? (
              <div className={styles.empty}>No reports submitted yet</div>
            ) : (
              <div className={styles.reportGrid}>
                {data.recentReports.map((report) => {
                  const config = NOISE_TYPE_CONFIG[report.noiseType];
                  return (
                    <Card key={report._id} className={styles.reportCard}>
                      <h3>{config.label}</h3>
                      <p>{report.description || 'Community noise report'}</p>
                      <div className={styles.reportMeta}>
                        <span className={styles.pill} style={{ background: getIntensityColor(report.intensity), color: '#fff' }}>{report.intensity}/10</span>
                        <span>{report.district || 'Lahore'}</span>
                        <span>{formatRelativeTime(report.occurredAt)}</span>
                        <span>{report.upvotes} upvotes</span>
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
