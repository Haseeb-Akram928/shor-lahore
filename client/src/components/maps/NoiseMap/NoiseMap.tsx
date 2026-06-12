'use client';

import MapView, { NavigationControl, ScaleControl, type MapRef } from 'react-map-gl/maplibre';
import { AlertCircle, Loader2, MapPin, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { HeatmapOverlay } from '@/components/maps/HeatmapOverlay/HeatmapOverlay';
import { ReportMarker } from '@/components/maps/ReportMarker/ReportMarker';
import { TimeSlider } from '@/components/maps/TimeSlider/TimeSlider';
import { LAHORE_CENTER, MAP_STYLE, NOISE_TYPE_CONFIG } from '@/lib/constants';
import { useHeatmapReports } from '@/hooks/useReports';
import { useSocket } from '@/hooks/useSocket';
import type { HeatmapPoint, NoiseReport, NoiseType } from '@/types';
import styles from './NoiseMap.module.css';

const ALL_NOISE_TYPES = Object.keys(NOISE_TYPE_CONFIG) as NoiseType[];
type DatePreset = '24h' | '7d' | '30d' | 'all';

interface MapBounds {
  swLng: number;
  swLat: number;
  neLng: number;
  neLat: number;
}

function toHeatmapPoint(report: NoiseReport): HeatmapPoint {
  return {
    _id: report._id,
    coordinates: report.location.coordinates,
    intensity: report.intensity,
    noiseType: report.noiseType,
    district: report.district,
    description: report.description,
    tags: report.tags,
    user: report.user,
    occurredAt: report.occurredAt,
    createdAt: report.createdAt,
    upvotes: report.upvotes,
  };
}

export function NoiseMap() {
  const mapRef = useRef<MapRef | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [minIntensity, setMinIntensity] = useState(1);
  const [maxIntensity, setMaxIntensity] = useState(10);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [selectedNoiseTypes, setSelectedNoiseTypes] = useState<NoiseType[]>(ALL_NOISE_TYPES);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [liveReports, setLiveReports] = useState<HeatmapPoint[]>([]);
  const [pulseReportIds, setPulseReportIds] = useState<Set<string>>(new Set());
  const { socket, isConnected } = useSocket(false);

  const dateRange = useMemo(() => {
    if (datePreset === 'all') return {};

    const from = new Date();
    const days = datePreset === '24h' ? 1 : datePreset === '7d' ? 7 : 30;
    from.setDate(from.getDate() - days);

    return { from: from.toISOString(), to: new Date().toISOString() };
  }, [datePreset]);

  const query = useMemo(() => ({
    ...(bounds || {}),
    hour: hour ?? undefined,
    noiseTypes: selectedNoiseTypes.length === ALL_NOISE_TYPES.length ? undefined : selectedNoiseTypes.join(','),
    minIntensity,
    maxIntensity,
    ...dateRange,
    limit: 700,
  }), [bounds, dateRange, hour, maxIntensity, minIntensity, selectedNoiseTypes]);

  const { data, isLoading, error } = useHeatmapReports(query);
  const visibleReports = useMemo(() => {
    const reportsById = new Map<string, HeatmapPoint>();
    for (const report of liveReports) reportsById.set(report._id, report);
    for (const report of data) reportsById.set(report._id, report);
    return Array.from(reportsById.values());
  }, [data, liveReports]);

  const syncBounds = useCallback(() => {
    const map = mapRef.current?.getMap();
    const currentBounds = map?.getBounds();
    if (!currentBounds) return;

    setBounds({
      swLng: Number(currentBounds.getWest().toFixed(5)),
      swLat: Number(currentBounds.getSouth().toFixed(5)),
      neLng: Number(currentBounds.getEast().toFixed(5)),
      neLat: Number(currentBounds.getNorth().toFixed(5)),
    });
  }, []);

  const toggleNoiseType = (type: NoiseType) => {
    setSelectedNoiseTypes((current) => {
      if (!current.includes(type)) return [...current, type];
      if (current.length === 1) return current;
      return current.filter((item) => item !== type);
    });
  };

  const resetFilters = () => {
    setHour(null);
    setMinIntensity(1);
    setMaxIntensity(10);
    setDatePreset('all');
    setSelectedNoiseTypes(ALL_NOISE_TYPES);
  };

  const matchesActiveFilters = useCallback((report: HeatmapPoint) => {
    const [lng, lat] = report.coordinates;
    const occurredAt = new Date(report.occurredAt);

    if (!selectedNoiseTypes.includes(report.noiseType)) return false;
    if (report.intensity < minIntensity || report.intensity > maxIntensity) return false;
    if (hour !== null && occurredAt.getUTCHours() !== hour) return false;
    if (dateRange.from && occurredAt < new Date(dateRange.from)) return false;
    if (dateRange.to && occurredAt > new Date(dateRange.to)) return false;
    if (bounds && (lng < bounds.swLng || lng > bounds.neLng || lat < bounds.swLat || lat > bounds.neLat)) return false;

    return true;
  }, [bounds, dateRange.from, dateRange.to, hour, maxIntensity, minIntensity, selectedNoiseTypes]);

  useEffect(() => {
    setLiveReports([]);
  }, [query]);

  useEffect(() => {
    socket.connect();

    const handleReportCreated = (report: NoiseReport) => {
      const point = toHeatmapPoint(report);
      if (!matchesActiveFilters(point)) return;

      setLiveReports((current) => [point, ...current.filter((item) => item._id !== point._id)].slice(0, 100));
      setPulseReportIds((current) => new Set(current).add(point._id));
      window.setTimeout(() => {
        setPulseReportIds((current) => {
          const next = new Set(current);
          next.delete(point._id);
          return next;
        });
      }, 3200);
    };

    socket.on('map-report-created', handleReportCreated);
    return () => {
      socket.off('map-report-created', handleReportCreated);
    };
  }, [matchesActiveFilters, socket]);

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
            <strong>{visibleReports.length}</strong>
            <span>visible reports</span>
          </div>
          <div>
            <strong>{hour === null ? '24h' : `${hour}:00`}</strong>
            <span>time window</span>
          </div>
        </div>

        <div className={styles.connection}>
          <span className={isConnected ? styles.liveDot : styles.offlineDot} />
          {isConnected ? 'Live updates connected' : 'Live updates offline'}
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterHeader}>
            <span>Noise sources</span>
            <Button variant="ghost" onClick={resetFilters} aria-label="Reset map filters">
              <RotateCcw size={15} />
            </Button>
          </div>
          <div className={styles.typeGrid}>
            {ALL_NOISE_TYPES.map((type) => {
              const config = NOISE_TYPE_CONFIG[type];
              const isChecked = selectedNoiseTypes.includes(type);

              return (
                <label key={type} className={isChecked ? styles.typeOptionActive : styles.typeOption}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleNoiseType(type)}
                  />
                  <i style={{ background: config.color }} />
                  <span>{config.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.field}>
            <span>Minimum intensity</span>
            <input
              type="range"
              min={1}
              max={10}
              value={minIntensity}
              onChange={(event) => setMinIntensity(Math.min(Number(event.target.value), maxIntensity))}
            />
            <strong>{minIntensity}/10</strong>
          </label>
          <label className={styles.field}>
            <span>Maximum intensity</span>
            <input
              type="range"
              min={1}
              max={10}
              value={maxIntensity}
              onChange={(event) => setMaxIntensity(Math.max(Number(event.target.value), minIntensity))}
            />
            <strong>{maxIntensity}/10</strong>
          </label>
          <label className={styles.selectField}>
            <span>Date range</span>
            <select value={datePreset} onChange={(event) => setDatePreset(event.target.value as DatePreset)}>
              <option value="all">All reports</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </label>
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
        <MapView
          ref={mapRef}
          initialViewState={LAHORE_CENTER}
          mapStyle={MAP_STYLE}
          minZoom={9}
          maxZoom={17}
          attributionControl={false}
          reuseMaps
          onLoad={syncBounds}
          onMoveEnd={syncBounds}
        >
          <NavigationControl position="top-right" visualizePitch />
          <ScaleControl position="bottom-left" />
          <HeatmapOverlay data={visibleReports} />
          {visibleReports.slice(0, 80).map((report) => (
            <ReportMarker key={report._id} report={report} isPulsing={pulseReportIds.has(report._id)} />
          ))}
        </MapView>
        <Button asChild href="/report" className={styles.reportFab}>
          <MapPin size={16} />
          Report Noise
        </Button>
        <div className={styles.slider}>
          <TimeSlider hour={hour} onChange={setHour} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
}
