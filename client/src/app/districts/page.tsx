import { Card } from '@/components/ui/Card/Card';

export const metadata = {
  title: 'Districts',
};

export default function DistrictsPage() {
  return (
    <section className="page-band">
      <div className="container">
        <Card>
          <h1>Districts</h1>
          <p className="muted">District browsing UI will connect to the Phase 2 district API in Phase 4.</p>
        </Card>
      </div>
    </section>
  );
}
