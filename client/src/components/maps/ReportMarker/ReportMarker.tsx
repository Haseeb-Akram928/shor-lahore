'use client';

import { Marker, Popup } from 'react-map-gl/maplibre';
import { useState } from 'react';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { formatRelativeTime, getIntensityColor } from '@/lib/utils';
import type { HeatmapPoint } from '@/types';
import styles from './ReportMarker.module.css';

interface ReportMarkerProps {
  report: HeatmapPoint;
}

export function ReportMarker({ report }: ReportMarkerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = NOISE_TYPE_CONFIG[report.noiseType];

  return (
    <>
      <Marker longitude={report.coordinates[0]} latitude={report.coordinates[1]} anchor="bottom">
        <button
          className={styles.marker}
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
            {report.description && <p>{report.description}</p>}
            <small>{formatRelativeTime(report.occurredAt)}</small>
          </div>
        </Popup>
      )}
    </>
  );
}
