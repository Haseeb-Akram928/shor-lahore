import { INTENSITY_COLORS } from './constants';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function getIntensityColor(intensity: number): string {
  const index = Math.max(0, Math.min(9, Math.round(intensity) - 1));
  return INTENSITY_COLORS[index];
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-PK');
}

export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function formatNumber(value: number): string {
  return Intl.NumberFormat('en-PK').format(value);
}
