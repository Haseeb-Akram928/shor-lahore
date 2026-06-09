'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable/DataTable';
import { DistrictRankChart } from '@/components/charts/DistrictRankChart/DistrictRankChart';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import type { ApiResponse, District, DistrictStats } from '@/types';
import styles from '../adminRoute.module.css';

interface DistrictRow extends District {
  topNoiseType?: DistrictStats['topNoiseType'];
}

export function AdminDistrictsView() {
  const [rows, setRows] = useState<DistrictRow[]>([]);
  const [stats, setStats] = useState<DistrictStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [districtRes, statsRes] = await Promise.all([
          api.get<ApiResponse<District[]>>('/districts'),
          api.get<ApiResponse<DistrictStats[]>>('/analytics/by-district', { period: 'all' }),
        ]);

        if (!isCurrent) return;
        const statByName = new Map(statsRes.data.map((item) => [item.district, item]));
        setStats(statsRes.data);
        setRows(districtRes.data.map((district) => ({
          ...district,
          avgNoiseLevel: statByName.get(district.name)?.avgIntensity ?? district.avgNoiseLevel,
          totalReports: statByName.get(district.name)?.totalReports ?? district.totalReports,
          topNoiseType: statByName.get(district.name)?.topNoiseType,
        })));
      } catch (err) {
        if (!isCurrent) return;
        setError(err instanceof Error ? err.message : 'Unable to load districts');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, []);

  const columns = useMemo<Array<DataTableColumn<DistrictRow>>>(() => [
    {
      key: 'name',
      header: 'District',
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
          <h1>Districts</h1>
          <p>Review mapped Lahore districts, report totals, and average intensity rankings.</p>
        </div>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.wide}>
        <DistrictRankChart data={stats} isLoading={isLoading} error={error ? 'Unable to load this panel' : null} />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(district) => district._id}
        isLoading={isLoading}
        emptyMessage="No districts found"
        minWidth="100%"
        tableLayout="fixed"
      />
    </section>
  );
}
