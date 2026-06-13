import { Card } from '@/components/ui/Card/Card';
import { formatHour, getIntensityColor } from '@/lib/utils';
import type { HeatmapGridCell } from '@/types';
import styles from './IntensityHeatmapGrid.module.css';

interface IntensityHeatmapGridProps {
  data: HeatmapGridCell[];
  isLoading?: boolean;
  error?: string | null;
}

export function IntensityHeatmapGrid({ data, isLoading = false, error = null }: IntensityHeatmapGridProps) {
  const districts = Array.from(new Set(data.map((cell) => cell.district))).sort();
  const valueByKey = new Map(data.map((cell) => [`${cell.district}-${cell.hour}`, cell.avgIntensity]));

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Area x hour intensity</h2>
        <p>Average intensity by Lahore area and hour</p>
      </div>

      {isLoading && <div className={styles.state}>Loading intensity matrix...</div>}
      {!isLoading && error && <div className={styles.state}>{error}</div>}
      {!isLoading && !error && districts.length === 0 && <div className={styles.state}>No matrix data yet</div>}

      {!isLoading && !error && districts.length > 0 && (
        <div className={styles.scroll} aria-label="Area by hour intensity heatmap">
          <div className={styles.grid}>
            <span className={styles.corner}>Area</span>
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className={styles.hour}>{hour % 4 === 0 ? formatHour(hour) : hour}</span>
            ))}
            {districts.map((district) => (
              <div key={district} className={styles.row}>
                <strong>{district}</strong>
                {Array.from({ length: 24 }, (_, hour) => {
                  const value = valueByKey.get(`${district}-${hour}`) || 0;
                  return (
                    <span
                      key={`${district}-${hour}`}
                      className={styles.cell}
                      style={{ background: value ? getIntensityColor(value) : 'var(--surface-muted)' }}
                      title={`${district}, ${formatHour(hour)}: ${value ? value.toFixed(1) : 'No data'}`}
                    >
                      {value ? value.toFixed(1) : ''}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
