import {
  ArrowRight,
  BarChart3,
  FileText,
  Globe,
  MapPin,
  Radio,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { CountUp } from '@/components/ui/CountUp/CountUp';
import { NoiseWaveform } from '@/components/ui/NoiseWaveform/NoiseWaveform';
import { NoiseTypeShowcase } from '@/components/ui/NoiseTypeShowcase/NoiseTypeShowcase';
import { ActivityTicker } from '@/components/ui/ActivityTicker/ActivityTicker';
import styles from './page.module.css';

const steps = [
  {
    number: '01',
    title: 'Spot the noise',
    description: 'Hear something disruptive? Open the app and tap your location on the map.',
    icon: MapPin,
  },
  {
    number: '02',
    title: 'Classify & report',
    description: 'Select the noise type, rate its intensity from 1-10, and add a description.',
    icon: FileText,
  },
  {
    number: '03',
    title: 'See the impact',
    description: 'Watch your report appear on the live heatmap and contribute to city-wide analytics.',
    icon: TrendingUp,
  },
];

const features = [
  {
    icon: Globe,
    title: 'GPU-Accelerated Heatmaps',
    description: 'deck.gl renders thousands of noise data points in real-time with animated 24-hour time filtering.',
  },
  {
    icon: BarChart3,
    title: 'Area Analytics',
    description: 'Compare noise levels across Lahore\'s neighborhoods and commercial areas with hourly breakdowns and trend analysis.',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description: 'Socket.io pushes new reports to the map instantly, no refresh needed.',
  },
  {
    icon: Shield,
    title: 'Authenticated Reporting',
    description: 'JWT-secured submissions with upvoting, status tracking, and admin moderation.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Every resident becomes a sensor. Crowdsourced data builds a living noise profile of the city.',
  },
  {
    icon: Radio,
    title: '12 Noise Categories',
    description: 'From traffic horns to construction, generators to religious loudspeakers, Lahore-specific types.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <Badge tone="brand">Crowdsourced Civic Tech</Badge>
              <h1 className={styles.headline}>
                Your City&apos;s Noise,<br />
                <span className={styles.headlineAccent}>Mapped.</span>
              </h1>
              <p className={styles.subtitle}>
                Crowdsourced noise data for Lahore. Discover the quietest neighborhoods,
                report disturbances, and help shape a quieter city.
              </p>
              <div className={styles.actions}>
                <Button asChild href="/map">
                  Explore Map <ArrowRight size={16} />
                </Button>
                <Button asChild href="/report" variant="secondary">
                  Report Noise
                </Button>
              </div>
              <NoiseWaveform className={styles.waveform} />
            </div>

            {/* Map preview */}
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

      {/* Stats bar */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            <CountUp end={900} label="Noise Reports" icon={<FileText size={20} />} suffix="+" />
            <CountUp end={10} label="Areas Mapped" icon={<MapPin size={20} />} />
            <CountUp end={12} label="Noise Categories" icon={<Radio size={20} />} />
            <CountUp end={24} label="Hours Tracked" icon={<TrendingUp size={20} />} suffix="h" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`page-band ${styles.section}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <Badge tone="brand">How it works</Badge>
            <h2>Report noise in three steps</h2>
            <p>No complex setup. Just open, point, and submit.</p>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={styles.stepCard}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className={styles.stepNumber}>{step.number}</span>
                  <span className={styles.stepIcon}>
                    <Icon size={24} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Noise types */}
      <section className={`page-band ${styles.section}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <Badge tone="warning">Categories</Badge>
            <h2>12 noise types, tailored for Lahore</h2>
            <p>
              The app covers pressure horns on Ferozepur Road, generators during load-shedding,
              and other Lahore-specific noise sources.
            </p>
          </div>
          <NoiseTypeShowcase />
        </div>
      </section>

      {/* ═══ FEATURES BENTO GRID ═══ */}
      <section className={`page-band ${styles.section}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <Badge tone="brand">Platform</Badge>
            <h2>Built for real impact</h2>
            <p>A full-stack platform with real geospatial engineering, not a toy CRUD app.</p>
          </div>
          <div className={styles.bentoGrid}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={styles.bentoCard}
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  <span className={styles.bentoIcon}>
                    <Icon size={24} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className={styles.bentoGlow} aria-hidden="true" />
                </div>
              );
            })}
            <div className={`${styles.bentoCard} ${styles.bentoTicker}`}>
              <ActivityTicker />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <Card className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2>Ready to map Lahore&apos;s noise?</h2>
              <p>
                Join hundreds of residents contributing to a quieter city.
                Every report makes a difference.
              </p>
              <div className={styles.ctaActions}>
                <Button asChild href="/signup">
                  Create Free Account <ArrowRight size={16} />
                </Button>
                <Button asChild href="/map" variant="secondary">
                  View Live Map
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
