'use client';

import { Marker, Popup } from 'react-map-gl/maplibre';
import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { api } from '@/lib/api';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { cx, formatRelativeTime, getIntensityColor } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ApiResponse, HeatmapPoint, NoiseReport } from '@/types';
import styles from './ReportMarker.module.css';

interface ReportMarkerProps {
  report: HeatmapPoint;
  isPulsing?: boolean;
}

export function ReportMarker({ report, isPulsing = false }: ReportMarkerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [upvotes, setUpvotes] = useState(report.upvotes);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();
  const config = NOISE_TYPE_CONFIG[report.noiseType];
  const reporterName = typeof report.user === 'string' ? 'Resident' : report.user?.name || 'Resident';

  const upvote = async () => {
    if (!isAuthenticated) {
      notify({
        title: 'Login required',
        description: 'Sign in before upvoting community reports.',
        tone: 'warning',
      });
      return;
    }

    setIsUpvoting(true);
    try {
      const response = await api.post<ApiResponse<{ report: NoiseReport }>>(`/reports/${report._id}/upvote`);
      setUpvotes(response.data.report.upvotes);
      notify({
        title: 'Upvote added',
        description: 'Thanks for helping surface important noise reports.',
        tone: 'success',
      });
    } catch (err) {
      notify({
        title: 'Upvote failed',
        description: err instanceof Error ? err.message : 'Unable to upvote this report.',
        tone: 'error',
      });
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <>
      <Marker longitude={report.coordinates[0]} latitude={report.coordinates[1]} anchor="bottom">
        <button
          className={cx(styles.marker, isPulsing && styles.pulsing)}
          style={{ '--marker-color': getIntensityColor(report.intensity) } as React.CSSProperties}
          onClick={() => setIsOpen(true)}
          aria-label={`${config.label} noise report`}
        >
          <span>{report.intensity}</span>
        </button>
      </Marker>
      {isOpen && (
        <Popup
          longitude={report.coordinates[0]}
          latitude={report.coordinates[1]}
          onClose={() => setIsOpen(false)}
          closeButton
          closeOnClick={false}
          maxWidth="280px"
        >
          <div className={styles.popup}>
            <strong>{config.label}</strong>
            <span>Intensity {report.intensity}/10</span>
            {report.district && <span>{report.district}</span>}
            <span>Reported by {reporterName}</span>
            {report.description && <p>{report.description}</p>}
            {!!report.tags?.length && (
              <div className={styles.tags}>
                {report.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            )}
            <small>{formatRelativeTime(report.occurredAt)}</small>
            <Button className={styles.upvote} variant="secondary" isLoading={isUpvoting} onClick={() => void upvote()}>
              <ThumbsUp size={14} aria-hidden="true" />
              <span>{upvotes}</span>
            </Button>
          </div>
        </Popup>
      )}
    </>
  );
}
