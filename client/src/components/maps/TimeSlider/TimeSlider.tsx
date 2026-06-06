'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { formatHour } from '@/lib/utils';
import styles from './TimeSlider.module.css';

interface TimeSliderProps {
  hour: number | null;
  onChange: (hour: number | null) => void;
}

export function TimeSlider({ hour, onChange }: TimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const activeHour = hour ?? 12;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      onChange(((hour ?? 0) + 1) % 24);
    }, 900);
    return () => window.clearInterval(timer);
  }, [hour, isPlaying, onChange]);

  return (
    <div className={styles.sliderPanel}>
      <div className={styles.controls}>
        <Button variant="secondary" onClick={() => setIsPlaying((current) => !current)} aria-label={isPlaying ? 'Pause time animation' : 'Play time animation'}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <div className={styles.readout}>
          <strong>{hour === null ? 'All hours' : formatHour(activeHour)}</strong>
          <span>{hour === null ? 'Aggregated reports' : 'Hourly heatmap filter'}</span>
        </div>
        <Button variant="ghost" onClick={() => onChange(null)} aria-label="Reset time filter">
          <RotateCcw size={16} />
        </Button>
      </div>
      <input
        type="range"
        min={0}
        max={23}
        value={activeHour}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Hour of day"
      />
    </div>
  );
}
