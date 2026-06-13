'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable/DataTable';
import { DistrictRankChart } from '@/components/charts/DistrictRankChart/DistrictRankChart';
import { Input } from '@/components/ui/Input/Input';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import type { ApiResponse, District, DistrictStats, GeoJSONPolygon } from '@/types';
import styles from '../adminRoute.module.css';

interface DistrictRow extends District {
  topNoiseType?: DistrictStats['topNoiseType'];
}

export function AdminDistrictsView() {
  const [rows, setRows] = useState<DistrictRow[]>([]);
  const [stats, setStats] = useState<DistrictStats[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Lahore');
  const [boundaryText, setBoundaryText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async (options: { quiet?: boolean } = {}) => {
    if (!options.quiet) setIsLoading(true);
    setError(null);
    try {
      const [districtRes, statsRes] = await Promise.all([
        api.get<ApiResponse<District[]>>('/districts'),
        api.get<ApiResponse<DistrictStats[]>>('/analytics/by-district', { period: 'all' }),
      ]);

      const statByName = new Map(statsRes.data.map((item) => [item.district, item]));
      setStats(statsRes.data);
      setRows(districtRes.data.map((district) => ({
        ...district,
        avgNoiseLevel: statByName.get(district.name)?.avgIntensity ?? district.avgNoiseLevel,
        totalReports: statByName.get(district.name)?.totalReports ?? district.totalReports,
        topNoiseType: statByName.get(district.name)?.topNoiseType,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load areas');
    } finally {
      if (!options.quiet) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createDistrict = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    let boundary: GeoJSONPolygon;
    try {
      boundary = JSON.parse(boundaryText) as GeoJSONPolygon;
    } catch {
      setFormError('Boundary must be valid GeoJSON.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post<ApiResponse<District>>('/districts', {
        name,
        city,
        boundary,
      });
      setName('');
      setCity('Lahore');
      setBoundaryText('');
      await load({ quiet: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create area');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<Array<DataTableColumn<DistrictRow>>>(() => [
    {
      key: 'name',
      header: 'Area',
      render: (district) => <strong>{district.name}</strong>,
    },
    {
      key: 'city',
      header: 'City',
      render: (district) => district.city || 'Lahore',
    },
    {
      key: 'reports',
      header: 'Reports',
      render: (district) => district.totalReports,
    },
    {
      key: 'avg',
      header: 'Avg intensity',
      render: (district) => district.avgNoiseLevel.toFixed(1),
    },
    {
      key: 'type',
      header: 'Top type',
      render: (district) => {
        if (!district.topNoiseType) return 'No data';
        const config = NOISE_TYPE_CONFIG[district.topNoiseType];
        return <Badge>{config.label}</Badge>;
      },
    },
  ], []);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Coverage</span>
          <h1>Areas</h1>
          <p>Review mapped Lahore areas, report totals, and average intensity rankings.</p>
        </div>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <form className={styles.managementPanel} onSubmit={(event) => void createDistrict(event)}>
        <div>
          <h2>Add area</h2>
          <p>Create a mapped Lahore area with a closed GeoJSON polygon.</p>
        </div>
        <div className={styles.formGrid}>
          <Input
            label="Area name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            disabled={isSaving}
          />
          <Input
            label="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={80}
            required
            disabled={isSaving}
          />
          <label className={styles.textareaField}>
            <span>GeoJSON polygon</span>
            <textarea
              value={boundaryText}
              onChange={(event) => setBoundaryText(event.target.value)}
              placeholder='{"type":"Polygon","coordinates":[[[74.33,31.52],[74.36,31.52],[74.36,31.55],[74.33,31.55],[74.33,31.52]]]}'
              rows={5}
              required
              disabled={isSaving}
            />
          </label>
        </div>
        {formError && <div className={styles.error} role="alert">{formError}</div>}
        <div className={styles.actions}>
          <Button type="submit" isLoading={isSaving} disabled={isSaving}>
            Add area
          </Button>
        </div>
      </form>

      <div className={styles.wide}>
        <DistrictRankChart data={stats} isLoading={isLoading} error={error ? 'Unable to load this panel' : null} />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(district) => district._id}
        isLoading={isLoading}
        emptyMessage="No areas found"
        minWidth="100%"
        tableLayout="fixed"
      />
    </section>
  );
}
