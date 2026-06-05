import {
  AudioLines,
  Car,
  Construction,
  Dog,
  Factory,
  HelpCircle,
  Megaphone,
  Music2,
  Siren,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';

export const NOISE_TYPE_CONFIG = {
  construction: { label: 'Construction', color: '#f97316', icon: Construction },
  traffic: { label: 'Traffic', color: '#ef4444', icon: Car },
  nightlife: { label: 'Nightlife', color: '#a855f7', icon: Music2 },
  neighbors: { label: 'Neighbors', color: '#06b6d4', icon: Users },
  industrial: { label: 'Industrial', color: '#78716c', icon: Factory },
  animals: { label: 'Animals', color: '#22c55e', icon: Dog },
  sirens: { label: 'Sirens', color: '#dc2626', icon: Siren },
  religious: { label: 'Religious', color: '#eab308', icon: Megaphone },
  generators: { label: 'Generators', color: '#f59e0b', icon: Zap },
  horns: { label: 'Horns', color: '#e11d48', icon: Volume2 },
  music: { label: 'Music', color: '#8b5cf6', icon: AudioLines },
  other: { label: 'Other', color: '#6b7280', icon: HelpCircle },
} as const;

export const INTENSITY_COLORS = [
  '#22c55e',
  '#4ade80',
  '#84cc16',
  '#a3e635',
  '#eab308',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#dc2626',
  '#991b1b',
];

export const LAHORE_CENTER = {
  longitude: 74.3507,
  latitude: 31.5580,
  zoom: 12,
};

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';
