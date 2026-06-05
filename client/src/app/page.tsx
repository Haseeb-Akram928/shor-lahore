import { Activity, BarChart3, MapPin, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import styles from './page.module.css';

const highlights = [
  { label: 'Districts seeded', value: '10' },
  { label: 'Mock reports', value: '900' },
  { label: 'Noise categories', value: '12' },
];

export default function Home() {
  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <Badge tone="brand">Phase 3 frontend foundation</Badge>
              <h1>ShorLahore</h1>
              <p>
                A civic noise mapping workspace for Lahore, built around geospatial reports,
                district analytics, and real-time map updates.
              </p>
              <div className={styles.actions}>
                <Button asChild href="/login">Admin login</Button>
                <Button asChild href="/signup" variant="secondary">Create account</Button>
              </div>
            </div>

            <div className={styles.mapPreview} aria-label="Lahore noise map preview">
              <div className={styles.mapHeader}>
                <span>Lahore live noise grid</span>
                <Radio size={18} />
              </div>
              <div className={styles.grid}>
                {Array.from({ length: 96 }, (_, index) => (
                  <span key={index} className={styles.cell} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-band">
        <div className="container">
          <div className={styles.stats}>
            {highlights.map((item) => (
              <Card key={item.label} className={styles.statCard}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="page-band">
        <div className="container">
          <div className={styles.featureGrid}>
            <Card>
              <MapPin size={22} />
              <h2>Location-aware reports</h2>
              <p>GeoJSON coordinates and district polygons prepare the app for map-driven reporting.</p>
            </Card>
            <Card>
              <BarChart3 size={22} />
              <h2>Analytics-ready backend</h2>
              <p>Phase 2 endpoints already expose overview, trend, hourly, and district metrics.</p>
            </Card>
            <Card>
              <Activity size={22} />
              <h2>Real-time foundation</h2>
              <p>Socket.io helpers are wired for live reports, dashboard feeds, and future map updates.</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
