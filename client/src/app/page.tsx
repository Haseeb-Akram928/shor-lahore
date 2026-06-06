import { Activity, BarChart3, MapPin, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import styles from './page.module.css';

const highlights = [
  { label: 'Districts seeded', value: '10' },
  { label: 'Mock reports', value: '900' },
  { label: 'Live map filters', value: '24h' },
];

export default function Home() {
  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <Badge tone="brand">Phase 4 map and public pages</Badge>
              <h1>ShorLahore</h1>
              <p>
                A civic noise mapping workspace for Lahore, built around geospatial reports,
                district analytics, and real-time map updates.
              </p>
              <div className={styles.actions}>
                <Button asChild href="/map">Explore map</Button>
                <Button asChild href="/report" variant="secondary">Report noise</Button>
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
              <p>Submit noise observations with a map-selected point, source, time, and intensity.</p>
            </Card>
            <Card>
              <BarChart3 size={22} />
              <h2>Analytics-ready backend</h2>
              <p>Phase 2 endpoints already expose overview, trend, hourly, and district metrics.</p>
            </Card>
            <Card>
              <Activity size={22} />
              <h2>Interactive noise map</h2>
              <p>MapLibre and deck.gl render report markers, heat layers, and hourly filtering.</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
