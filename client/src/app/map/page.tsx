import { Card } from '@/components/ui/Card/Card';

export const metadata = {
  title: 'Map',
};

export default function MapPage() {
  return (
    <section className="page-band">
      <div className="container">
        <Card>
          <h1>Noise map</h1>
          <p className="muted">MapLibre and heatmap components are scheduled for Phase 4.</p>
        </Card>
      </div>
    </section>
  );
}
