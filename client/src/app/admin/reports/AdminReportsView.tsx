'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, Flag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable/DataTable';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { formatRelativeTime, getIntensityColor } from '@/lib/utils';
import type { ApiResponse, PaginatedApiResponse, RecentReport, ReportStatus } from '@/types';
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
  const [maxIntensity, setMaxIntensity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
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
        maxIntensity: maxIntensity || undefined,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      });
      setReports(response.data);
      setSelectedIds((current) => new Set([...current].filter((id) => response.data.some((report) => report._id === id))));
      setPages(response.pagination.pages || 1);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [district, from, maxIntensity, minIntensity, noiseType, page, status, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (reportId: string, nextStatus: ReportStatus) => {
    try {
      await api.patch(`/reports/${reportId}/status`, { status: nextStatus });
      setReports((current) => current.map((report) => (
        report._id === reportId ? { ...report, status: nextStatus } : report
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update report status');
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      await api.delete(`/reports/${reportId}`);
      setReports((current) => current.filter((report) => report._id !== reportId));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(reportId);
        return next;
      });
      setTotal((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete report');
    }
  };

  const visibleReportIds = useMemo(() => reports.map((report) => report._id), [reports]);
  const allVisibleSelected = visibleReportIds.length > 0 && visibleReportIds.every((id) => selectedIds.has(id));

  const toggleReportSelection = (reportId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const toggleVisibleSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleReportIds.forEach((id) => next.delete(id));
      } else {
        visibleReportIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const bulkUpdateStatus = async (nextStatus: ReportStatus) => {
    if (selectedIds.size === 0) return;

    setIsBulkUpdating(true);
    setError(null);
    try {
      const response = await api.patch<ApiResponse<{
        matchedCount: number;
        modifiedCount: number;
        reports: RecentReport[];
      }>>('/reports/admin/bulk-status', {
        ids: Array.from(selectedIds),
        status: nextStatus,
      });
      const updatedById = new Map(response.data.reports.map((report) => [report._id, report]));
      setReports((current) => current.map((report) => updatedById.get(report._id) || report));
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update selected reports');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const columns = useMemo<Array<DataTableColumn<RecentReport>>>(() => [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={allVisibleSelected}
          onChange={toggleVisibleSelection}
          aria-label="Select all visible reports"
        />
      ),
      render: (report) => (
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={selectedIds.has(report._id)}
          onChange={() => toggleReportSelection(report._id)}
          aria-label={`Select ${report.noiseType} report`}
        />
      ),
    },
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
        return (
          <span className={styles.typeToken} style={{ color: config.color, borderColor: `${config.color}40` }}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'intensity',
      header: 'Intensity',
      render: (report) => (
        <span className={styles.pill} style={{ color: getIntensityColor(report.intensity), borderColor: `${getIntensityColor(report.intensity)}45` }}>
          {report.intensity}
        </span>
      ),
    },
    {
      key: 'district',
      header: 'Area',
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
        <div className={styles.rowActions}>
          <Button asChild href="/map" variant="ghost" className={styles.iconAction} aria-label="View report on map">
            <Eye size={16} />
          </Button>
          <Button variant="ghost" className={styles.dangerIconAction} onClick={() => void deleteReport(report._id)} aria-label="Delete report">
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ], [allVisibleSelected, selectedIds]);

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
        <Input label="Area" value={district} onChange={(event) => { setPage(1); setDistrict(event.target.value); }} />
        <Select label="Min intensity" value={minIntensity} onChange={(event) => { setPage(1); setMinIntensity(event.target.value); }}>
          <option value="">Any</option>
          {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </Select>
        <Select label="Max intensity" value={maxIntensity} onChange={(event) => { setPage(1); setMaxIntensity(event.target.value); }}>
          <option value="">Any</option>
          {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </Select>
        <Input label="From" type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} />
        <Input label="To" type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} />
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.tableHeader}>
        <p>Showing {reports.length} of {total} reports</p>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            disabled={selectedIds.size === 0 || isBulkUpdating}
            isLoading={isBulkUpdating}
            onClick={() => void bulkUpdateStatus('resolved')}
          >
            <CheckCircle2 size={16} />
            Resolve selected
          </Button>
          <Button
            variant="secondary"
            disabled={selectedIds.size === 0 || isBulkUpdating}
            onClick={() => void bulkUpdateStatus('flagged')}
          >
            <Flag size={16} />
            Flag selected
          </Button>
          <Button variant="secondary" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button variant="secondary" disabled={page >= pages || isLoading} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={reports} getRowKey={(report) => report._id} isLoading={isLoading} emptyMessage="No reports match these filters" />
    </section>
  );
}
