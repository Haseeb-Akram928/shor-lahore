import { DistrictDetailView } from './DistrictDetailView';

export const metadata = {
  title: 'Area Detail',
};

export default async function DistrictDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DistrictDetailView districtId={id} />;
}
