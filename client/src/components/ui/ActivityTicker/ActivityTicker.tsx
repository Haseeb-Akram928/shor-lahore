'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import styles from './ActivityTicker.module.css';

type NoiseTypeKey = keyof typeof NOISE_TYPE_CONFIG;

interface FakeReport {
  id: number;
  noiseType: NoiseTypeKey;
  area: string;
  intensity: number;
  timeAgo: string;
}

const AREAS = [
  'Gulberg III', 'DHA Phase 5', 'Model Town', 'Johar Town',
  'Garden Town', 'Faisal Town', 'Anarkali', 'Mall Road',
  'Liberty Market', 'Walled City', 'Cavalry Ground', 'Cantt',
  'Township', 'Iqbal Town', 'Shadman', 'Muslim Town',
];

const TIMES = ['just now', '2m ago', '5m ago', '8m ago', '12m ago', '15m ago', '20m ago'];

const noiseTypes = Object.keys(NOISE_TYPE_CONFIG) as NoiseTypeKey[];

function generateReport(id: number): FakeReport {
  const noiseType = noiseTypes[id % noiseTypes.length];
  return {
    id,
    noiseType,
    area: AREAS[id % AREAS.length],
    intensity: 3 + (id % 8),
    timeAgo: TIMES[id % TIMES.length],
  };
}

const initialReports = Array.from({ length: 5 }, (_, i) => generateReport(i));

export function ActivityTicker() {
  const [reports, setReports] = useState<FakeReport[]>(initialReports);
  const [counter, setCounter] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + 1);
      setReports((prev) => {
        const newReport = generateReport(prev[0].id + prev.length);
        return [newReport, ...prev.slice(0, 4)];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.ticker}>
      <div className={styles.header}>
        <span className={styles.liveDot} />
        <span>Live activity</span>
      </div>
      <div className={styles.list}>
        {reports.map((report, index) => {
          const config = NOISE_TYPE_CONFIG[report.noiseType];
          const Icon = config.icon;
          return (
            <div
              key={`${report.id}-${counter}`}
              className={styles.item}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span
                className={styles.typeIcon}
                style={{ backgroundColor: `${config.color}18`, color: config.color }}
              >
                <Icon size={16} />
              </span>
              <div className={styles.info}>
                <strong>{config.label}</strong>
                <span className={styles.meta}>
                  <MapPin size={12} />
                  {report.area}
                </span>
              </div>
              <div className={styles.right}>
                <span
                  className={styles.intensityPill}
                  style={{
                    backgroundColor: report.intensity >= 7
                      ? 'color-mix(in srgb, var(--danger) 15%, transparent)'
                      : report.intensity >= 4
                        ? 'color-mix(in srgb, var(--warning) 15%, transparent)'
                        : 'color-mix(in srgb, var(--success) 15%, transparent)',
                    color: report.intensity >= 7
                      ? 'var(--danger)'
                      : report.intensity >= 4
                        ? 'var(--warning)'
                        : 'var(--success)',
                  }}
                >
                  {report.intensity}/10
                </span>
                <span className={styles.time}>{report.timeAgo}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
