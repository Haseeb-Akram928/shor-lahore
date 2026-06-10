'use client';

import Map, { NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { HeatmapOverlay } from '@/components/maps/HeatmapOverlay/HeatmapOverlay';
import { ReportMarker } from '@/components/maps/ReportMarker/ReportMarker';
import { TimeSlider } from '@/components/maps/TimeSlider/TimeSlider';
import { LAHORE_CENTER, MAP_STYLE, NOISE_TYPE_CONFIG } from '@/lib/constants';
import { useHeatmapReports } from '@/hooks/useReports';
import styles from './NoiseMap.module.css';

export function NoiseMap() {
  const [hour, setHour] = useState<number | null>(null);
  const [minIntensity, setMinIntensity] = useState(1);
  const query = useMemo(() => ({ hour: hour ?? undefined, minIntensity, limit: 700 }), [hour, minIntensity]);
  const { data, isLoading, error } = useHeatmapReports(query);

  return (
    <section className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <Badge tone="brand">Live map</Badge>
          <h1>Lahore noise heatmap</h1>
          <p>Explore intensity patterns from seeded reports and new community submissions.</p>
        </div>

        <div className={styles.metricGrid}>
          <div>
            <strong>{data.length}</strong>
            <span>visible reports</span>
          </div>
          <div>
            <strong>{hour === null ? '24h' : `${hour}:00`}</strong>
            <span>time window</span>
          </div>
        </div>

        <label className={styles.field}>
          <span>Minimum intensity</span>
          <input
            type="range"
            min={1}
            max={10}
            value={minIntensity}
            onChange={(event) => setMinIntensity(Number(event.target.value))}
          />
          <strong>{minIntensity}/10</strong>
        </label>

        <div className={styles.legend}>
          {Object.entries(NOISE_TYPE_CONFIG).slice(0, 6).map(([key, config]) => (
            <span key={key}>
              <i style={{ background: config.color }} />
              {config.label}
            </span>
          ))}
        </div>

        {error && (
          <div className={styles.error} role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </aside>

      <div className={`${styles.mapWrap} ${isLoading ? styles.mapWrapLoading : ''}`}>
        {isLoading && (
          <div className={styles.loadingPill} role="status" aria-live="polite">
            <Loader2 className={styles.loadingIcon} size={16} aria-hidden="true" />
            <span>{data.length === 0 ? 'Loading heatmap' : hour === null ? 'Refreshing heatmap' : `Syncing ${hour}:00`}</span>
          </div>
        )}
        <Map
          initialViewState={LAHORE_CENTER}
          mapStyle={MAP_STYLE}
          minZoom={9}
          maxZoom={17}
          attributionControl={false}
          reuseMaps
        >
          <NavigationControl position="top-right" visualizePitch />
          <ScaleControl position="bottom-left" />
          <HeatmapOverlay data={data} />
          {data.slice(0, 80).map((report) => <ReportMarker key={report._id} report={report} />)}
        </Map>
        <div className={styles.slider}>
          <TimeSlider hour={hour} onChange={setHour} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
}
