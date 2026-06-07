'use client';

import { NOISE_TYPE_CONFIG } from '@/lib/constants';
import styles from './NoiseTypeShowcase.module.css';

const types = Object.entries(NOISE_TYPE_CONFIG) as [
  keyof typeof NOISE_TYPE_CONFIG,
  (typeof NOISE_TYPE_CONFIG)[keyof typeof NOISE_TYPE_CONFIG],
][];

export function NoiseTypeShowcase() {
  return (
    <div className={styles.grid}>
      {types.map(([key, config], index) => {
        const Icon = config.icon;
        return (
          <div
            key={key}
            className={styles.item}
            style={{
              '--type-color': config.color,
              animationDelay: `${index * 0.04}s`,
            } as React.CSSProperties}
          >
            <span className={styles.iconWrap}>
              <Icon size={22} />
            </span>
            <span className={styles.label}>{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}
