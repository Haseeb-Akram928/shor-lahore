'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { LocationPicker } from '@/components/maps/LocationPicker/LocationPicker';
import { api } from '@/lib/api';
import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ApiResponse, NoiseReport, NoiseType } from '@/types';
import styles from './ReportForm.module.css';

const noiseTypes = Object.keys(NOISE_TYPE_CONFIG) as NoiseType[];

export function ReportForm() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useToast();
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [noiseType, setNoiseType] = useState<NoiseType>('traffic');
  const [intensity, setIntensity] = useState(6);
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedConfig = useMemo(() => NOISE_TYPE_CONFIG[noiseType], [noiseType]);
  const SelectedIcon = selectedConfig.icon;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!coordinates) {
      setError('Select a location on the map');
      notify({
        title: 'Location required',
        description: 'Click the map or use your current location before submitting.',
        tone: 'warning',
      });
      return;
    }

    if (description.length > 500) {
      setError('Description cannot exceed 500 characters');
      notify({
        title: 'Description is too long',
        description: 'Keep the report description under 500 characters.',
        tone: 'warning',
      });
      return;
    }

    const occurredAtDate = new Date(occurredAt);
    if (Number.isNaN(occurredAtDate.getTime())) {
      setError('Select a valid date and time');
      notify({
        title: 'Invalid date',
        description: 'Choose a valid time for when the noise happened.',
        tone: 'warning',
      });
      return;
    }

    if (occurredAtDate > new Date()) {
      setError('Report time cannot be in the future');
      notify({
        title: 'Future time selected',
        description: 'Noise reports must use a time that has already happened.',
        tone: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post<ApiResponse<{ report: NoiseReport }>>('/reports', {
        lng: coordinates[0],
        lat: coordinates[1],
        noiseType,
        intensity,
        description,
        occurredAt: occurredAtDate.toISOString(),
      });
      setSuccess('Report submitted');
      notify({
        title: 'Report submitted',
        description: 'Thanks. Your report is now part of the Lahore noise map.',
        tone: 'success',
      });
      router.push('/map');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit report';
      setError(message);
      notify({
        title: 'Report was not submitted',
        description: message,
        tone: 'error',
      });
      setIsSubmitting(false);
    }
  };

  if (!isLoading && !isAuthenticated) {
    return (
      <Card className={styles.authRequired}>
        <h1>Login required</h1>
        <p className="muted">Noise reports are linked to accounts so the platform can prevent duplicate and spam submissions.</p>
        <Button asChild href="/login">Login to report</Button>
      </Card>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.mapColumn}>
        <LocationPicker value={coordinates} onChange={setCoordinates} />
      </div>

      <Card className={styles.panel}>
        <div className={styles.header}>
          <Badge tone="brand">New report</Badge>
          <h1>Report noise</h1>
          <p>Submit a precise location, source, and intensity for the disturbance.</p>
        </div>

        {error && (
          <div className={styles.alert} role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles.success} role="status">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <Select label="Noise type" value={noiseType} onChange={(event) => setNoiseType(event.target.value as NoiseType)}>
          {noiseTypes.map((type) => (
            <option key={type} value={type}>{NOISE_TYPE_CONFIG[type].label}</option>
          ))}
        </Select>

        <label className={styles.range}>
          <span>Intensity</span>
          <input min={1} max={10} type="range" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} />
          <strong>{intensity}/10</strong>
        </label>

        <Input
          label="When did this happen?"
          type="datetime-local"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
          max={new Date().toISOString().slice(0, 16)}
        />

        <label className={styles.textarea}>
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={5}
            placeholder="Optional context: recurring source, street, time pattern..."
          />
          <small>{description.length}/500</small>
        </label>

        <div className={styles.preview}>
          <SelectedIcon size={20} />
          <div>
            <strong>{selectedConfig.label}</strong>
            <span>Intensity {intensity}/10</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="submit" isLoading={isSubmitting} disabled={!coordinates || isLoading}>Submit report</Button>
          <Button asChild href="/map" variant="secondary">Back to map</Button>
        </div>

        <p className={styles.note}>
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </Card>
    </form>
  );
}
