'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ApiResponse, HeatmapPoint, NoiseReport } from '@/types';

interface HeatmapParams {
  hour?: number;
  minIntensity?: number;
  maxIntensity?: number;
  limit?: number;
}

export function useHeatmapReports(params: HeatmapParams) {
  const [data, setData] = useState<HeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<HeatmapPoint[]>>('/reports/heatmap', { ...params });
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load heatmap data');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}

export function useRecentReports(limit = 20) {
  const [data, setData] = useState<NoiseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<NoiseReport[]>>('/reports/recent', { limit });
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}
