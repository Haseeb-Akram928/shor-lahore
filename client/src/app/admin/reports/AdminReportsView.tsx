'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable/DataTable';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { formatRelativeTime, getIntensityColor } from '@/lib/utils';
import type { PaginatedApiResponse, RecentReport, ReportStatus } from '@/types';
import styles from '../adminRoute.module.css';

const STATUSES: ReportStatus[] = ['active', 'resolved', 'flagged'];

export function AdminReportsView() {
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [noiseType, setNoiseType] = useState('');
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [minIntensity, setMinIntensity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<PaginatedApiResponse<RecentReport>>('/reports/admin', {
        page,
        limit: 20,
        noiseType: noiseType || undefined,
        status: status || undefined,
        district: district || undefined,
        minIntensity: minIntensity || undefined,
      });
      setReports(response.data);
      setPages(response.pagination.pages || 1);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [district, minIntensity, noiseType, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (reportId: string, nextStatus: ReportStatus) => {
    await api.patch(`/reports/${reportId}/status`, { status: nextStatus });
    setReports((current) => current.map((report) => (
      report._id === reportId ? { ...report, status: nextStatus } : report
    )));
  };

  const deleteReport = async (reportId: string) => {
    await api.delete(`/reports/${reportId}`);
    setReports((current) => current.filter((report) => report._id !== reportId));
    setTotal((current) => Math.max(0, current - 1));
  };

  const columns = useMemo<Array<DataTableColumn<RecentReport>>>(() => [
    {
      key: 'date',
      header: 'Date',
      render: (report) => formatRelativeTime(report.createdAt),
    },
    {
      key: 'type',
      header: 'Type',
      render: (report) => {
        const config = NOISE_TYPE_CONFIG[report.noiseType];
        return <Badge><span style={{ color: config.color }}>{config.label}</span></Badge>;
      },
    },
    {
      key: 'intensity',
      header: 'Intensity',
      render: (report) => (
        <span className={styles.pill} style={{ background: getIntensityColor(report.intensity) }}>
          {report.intensity}
        </span>
      ),
    },
    {
      key: 'district',
      header: 'District',
      render: (report) => report.district || 'Unknown',
    },
    {
      key: 'status',
      header: 'Status',
      render: (report) => (
        <select
          className={styles.compactSelect}
          value={report.status}
          onChange={(event) => void updateStatus(report._id, event.target.value as ReportStatus)}
          aria-label={`Status for ${report.noiseType} report`}
        >
          {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (report) => typeof report.user === 'string' ? 'Resident' : (
        <span className={styles.truncate}>{report.user.name}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (report) => (
        <div className={styles.actions}>
          <Button asChild href={`/map`} variant="ghost" aria-label="View report on map">
            <Eye size={16} />
          </Button>
          <Button variant="danger" onClick={() => void deleteReport(report._id)} aria-label="Delete report">
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Moderation</span>
          <h1>Reports</h1>
          <p>Filter, resolve, flag, and remove community noise reports.</p>
        </div>
      </div>

      <div className={styles.filters}>
        <Select label="Noise type" value={noiseType} onChange={(event) => { setPage(1); setNoiseType(event.target.value); }}>
          <option value="">All types</option>
          {Object.entries(NOISE_TYPE_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          <option value="">All statuses</option>
          {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Input label="District" value={district} onChange={(event) => { setPage(1); setDistrict(event.target.value); }} />
        <Select label="Min intensity" value={minIntensity} onChange={(event) => { setPage(1); setMinIntensity(event.target.value); }}>
          <option value="">Any</option>
          {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </Select>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.tableHeader}>
        <p>Showing {reports.length} of {total} reports</p>
        <div className={styles.actions}>
          <Button variant="secondary" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button variant="secondary" disabled={page >= pages || isLoading} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={reports} getRowKey={(report) => report._id} isLoading={isLoading} emptyMessage="No reports match these filters" />
    </section>
  );
}
