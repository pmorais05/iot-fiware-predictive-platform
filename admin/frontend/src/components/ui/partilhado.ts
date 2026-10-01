import { HistoryPoint } from '../../lib/api';

export const FALLBACK_COLORS = ['#0f7ee7', '#38a4e8', '#d7bf42', '#10b981', '#8b5cf6', '#f59e0b'];

export const times = ['18:40','18:45','18:50','18:55','19:00','19:05','19:10','19:15','19:20','19:25','19:30','19:35'];

export function formatElapsed(isoTime: string | null): string {
  if (!isoTime) return '—';
  const diffMs = Date.now() - new Date(isoTime).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export type Series = { label: string; color: string; values: number[]; dashed?: boolean };
export type Point  = { x: number; y: number };
export type AlertRow = {
  id: string; machine: string; occurrence: string;
  severity: 'Crítico' | 'Aviso' | 'Info';
  status: 'Aberto' | 'Em análise' | 'Resolvido';
  firedAt: string;
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function toPoints(values: number[], min: number, max: number, width: number, height: number, padX = 42, padY = 28): Point[] {
  const range = max - min || 1;
  const plotWidth  = width  - padX * 2;
  const plotHeight = height - padY * 2;
  return values.map((value, index) => ({
    x: padX + (index / Math.max(values.length - 1, 1)) * plotWidth,
    y: padY + ((max - value) / range) * plotHeight,
  }));
}

export function toPointsRange(values: number[], min: number, max: number, xStart: number, xEnd: number, height: number, padY = 28): Point[] {
  const range = max - min || 1;
  const plotHeight = height - padY * 2;
  return values.map((value, index) => ({
    x: xStart + (index / Math.max(values.length - 1, 1)) * (xEnd - xStart),
    y: padY + ((max - value) / range) * plotHeight,
  }));
}

export function pathFromPoints(points: Point[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

export function smoothPathFromPoints(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length < 3) return pathFromPoints(points);

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function smoothPathContinuation(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length < 3) {
    return points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }
  let d = `L ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function smoothBandPath(top: Point[], bottom: Point[]) {
  if (top.length === 0 || bottom.length === 0) return '';
  const topCurve = smoothPathFromPoints(top);
  const bottomCurve = smoothPathContinuation([...bottom].reverse());
  return `${topCurve} ${bottomCurve} Z`;
}

export function pointsToSeries(
  machines: { label: string; color: string; points: HistoryPoint[] }[],
  bucketCount = 12,
): { series: Series[]; labels: string[] } {
  const withData = machines.filter((m) => m.points.length > 0);
  if (withData.length === 0) {
    return { series: machines.map((m) => ({ label: m.label, color: m.color, values: [] })), labels: [] };
  }
  const allMs = withData.flatMap((m) => m.points.map((p) => Date.parse(p.time)));
  const minMs = Math.min(...allMs);
  const maxMs = Math.max(...allMs);
  const slotMs = (maxMs - minMs) / Math.max(bucketCount - 1, 1);
  const slots = Array.from({ length: bucketCount }, (_, i) => minMs + i * slotMs);
  const labels = slots.map((t) => new Date(t).toISOString().slice(11, 16));
  const series = machines.map((m) => ({
    label: m.label,
    color: m.color,
    values: slots.map((slotT) => {
      if (m.points.length === 0) return 0;
      const closest = m.points.reduce((best, p) =>
        Math.abs(Date.parse(p.time) - slotT) < Math.abs(Date.parse(best.time) - slotT) ? p : best,
      );
      return Math.abs(Date.parse(closest.time) - slotT) <= slotMs ? closest.value : 0;
    }),
  }));
  return { series, labels };
}
