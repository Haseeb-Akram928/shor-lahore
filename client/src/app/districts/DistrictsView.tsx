'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Card } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { api } from '@/lib/api';
import type { ApiResponse, District } from '@/types';
import styles from './page.module.css';

export function DistrictsView() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get<ApiResponse<District[]>>('/districts');
        setDistricts(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load districts');
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <Badge tone="brand">District intelligence</Badge>
          <h1>Lahore districts</h1>
          <p>See how noise patterns differ across Lahore, from report volume to average intensity.</p>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className={styles.skeleton} />)}
          </div>
        ) : districts.length === 0 ? (
          <Card className={styles.empty}>
            <strong>No districts available</strong>
            <span>Seed or create Lahore districts to populate this view.</span>
          </Card>
        ) : (
          <div className={styles.grid}>
            {districts.map((district) => (
              <Card key={district._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <MapPin size={20} />
                  <strong>{district.name}</strong>
                </div>
                <div className={styles.stats}>
                  <span>
                    <strong>{district.totalReports}</strong>
                    reports
                  </span>
                  <span>
                    <strong>{district.avgNoiseLevel.toFixed(1)}</strong>
                    avg intensity
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
