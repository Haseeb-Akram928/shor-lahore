'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Card } from '@/components/ui/Card/Card';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { formatRelativeTime, getIntensityColor } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import type { RecentReport } from '@/types';
import styles from './LiveFeed.module.css';

interface LiveFeedProps {
  reports: RecentReport[];
  isLoading?: boolean;
  error?: string | null;
}

const getReporterName = (report: RecentReport) => (
  typeof report.user === 'string' ? 'Resident' : report.user.name
);

export function LiveFeed({ reports, isLoading = false, error = null }: LiveFeedProps) {
  const [items, setItems] = useState(reports);
  const { socket, isConnected } = useSocket(false);

  useEffect(() => {
    setItems(reports);
  }, [reports]);

  useEffect(() => {
    socket.connect();
    socket.emit('join-dashboard');

    const handleCreated = (report: RecentReport) => {
      setItems((current) => [report, ...current.filter((item) => item._id !== report._id)].slice(0, 10));
    };

    socket.on('report-created', handleCreated);
    return () => {
      socket.off('report-created', handleCreated);
    };
  }, [socket]);

  const visibleItems = items.slice(0, 10);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2>Live feed</h2>
          <p>Latest reports from Lahore</p>
        </div>
        <Badge tone={isConnected ? 'success' : 'neutral'} className={styles.status}>
          <Radio size={14} aria-hidden="true" />
          {isConnected ? 'Live' : 'Offline'}
        </Badge>
      </div>

      {isLoading && <div className={styles.state}>Loading live feed...</div>}
      {!isLoading && error && <div className={styles.state}>{error}</div>}
      {!isLoading && !error && visibleItems.length === 0 && <div className={styles.state}>No recent reports yet</div>}

      {!isLoading && !error && visibleItems.length > 0 && (
        <ol className={styles.list}>
          {visibleItems.map((report) => {
            const config = NOISE_TYPE_CONFIG[report.noiseType];
            const Icon = config.icon;

            return (
              <li key={report._id} className={styles.item}>
                <span className={styles.icon} style={{ color: config.color }}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className={styles.copy}>
                  <div className={styles.line}>
                    <strong>{config.label}</strong>
                    <span>{formatRelativeTime(report.createdAt)}</span>
                  </div>
                  <p>
                    {report.district || 'Lahore'} by {getReporterName(report)}
                  </p>
                </div>
                <span
                  className={styles.intensity}
                  style={{ background: getIntensityColor(report.intensity) }}
                  aria-label={`Intensity ${report.intensity}`}
                >
                  {report.intensity}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
