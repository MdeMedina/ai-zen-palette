import { formatDelta } from '@/pulse/shared';

export function Delta({ value, suffix }: { value: number | null; suffix?: string }) {
  const { text, dir } = formatDelta(value);
  return <span className={dir}>{text}{suffix ? ` ${suffix}` : ''}</span>;
}
