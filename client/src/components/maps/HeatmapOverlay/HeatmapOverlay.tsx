'use client';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { useControl } from 'react-map-gl/maplibre';
import type { HeatmapPoint } from '@/types';

interface HeatmapOverlayProps {
  data: HeatmapPoint[];
  radiusPixels?: number;
}

function DeckGLOverlay(props: ConstructorParameters<typeof MapboxOverlay>[0]) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export function HeatmapOverlay({ data, radiusPixels = 52 }: HeatmapOverlayProps) {
  const layer = new HeatmapLayer<HeatmapPoint>({
    id: 'noise-heatmap',
    data,
    getPosition: (point) => point.coordinates,
    getWeight: (point) => point.intensity,
    radiusPixels,
    intensity: 1,
    threshold: 0.04,
    colorRange: [
      [34, 197, 94, 35],
      [234, 179, 8, 70],
      [249, 115, 22, 110],
      [239, 68, 68, 155],
      [219, 39, 119, 190],
    ],
  });

  return <DeckGLOverlay layers={[layer]} />;
}
