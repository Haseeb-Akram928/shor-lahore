'use client';

import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import { LocateFixed, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { LAHORE_CENTER, MAP_STYLE } from '@/lib/constants';
import styles from './LocationPicker.module.css';

interface LocationPickerProps {
  value: [number, number] | null;
  onChange: (coordinates: [number, number]) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const useCurrentLocation = () => {
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        if (lng < 73.8 || lng > 74.8 || lat < 31.2 || lat > 31.8) {
          setError('Selected location must be inside Lahore');
          setIsLocating(false);
          return;
        }

        onChange([lng, lat]);
        setIsLocating(false);
      },
      () => {
        setError('Unable to access your location');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={styles.picker}>
      <Map
        initialViewState={{ ...LAHORE_CENTER, zoom: 11.5 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onClick={(event) => onChange([event.lngLat.lng, event.lngLat.lat])}
        minZoom={9}
        maxZoom={17}
      >
        <NavigationControl position="top-right" />
        {value && (
          <Marker longitude={value[0]} latitude={value[1]} anchor="bottom">
            <div className={styles.marker}>
              <MapPin size={28} />
            </div>
          </Marker>
        )}
      </Map>
      <div className={styles.locate}>
        <Button type="button" variant="secondary" isLoading={isLocating} onClick={useCurrentLocation}>
          <LocateFixed size={16} />
          Use my location
        </Button>
      </div>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      <div className={styles.coords}>
        {value ? `${value[1].toFixed(5)}, ${value[0].toFixed(5)}` : 'Click the map to set report location'}
      </div>
    </div>
  );
}
