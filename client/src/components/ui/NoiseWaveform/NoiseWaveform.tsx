'use client';

import styles from './NoiseWaveform.module.css';

interface NoiseWaveformProps {
  barCount?: number;
  className?: string;
}

export function NoiseWaveform({ barCount = 40, className }: NoiseWaveformProps) {
  return (
    <div className={`${styles.waveform} ${className || ''}`} aria-hidden="true">
      {Array.from({ length: barCount }, (_, i) => {
        // Create a pattern: higher in the middle, lower on edges
        const position = i / (barCount - 1);
        const centerFactor = 1 - Math.abs(position - 0.5) * 2;
        const baseHeight = 20 + centerFactor * 60;
        // Add some pseudo-random variation per bar
        const variation = Math.sin(i * 2.7) * 15 + Math.cos(i * 4.1) * 10;
        const height = Math.max(12, Math.min(85, baseHeight + variation));

        return (
          <span
            key={i}
            className={styles.bar}
            style={{
              '--bar-height': `${height}%`,
              '--bar-delay': `${i * 0.05}s`,
              '--bar-color': `hsl(${160 + (height / 85) * 20}, ${60 + (height / 85) * 30}%, ${45 + (1 - height / 85) * 20}%)`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
