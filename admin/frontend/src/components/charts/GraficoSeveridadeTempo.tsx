'use client';

import { Series } from '../ui/partilhado';
import { InteractiveLineChart } from './GraficoLinhasInterativo';

const severitySeriesDefault: Series[] = [
  { label: 'Crítico', color: '#ef4444', values: [0,1,1,0,2,1,0,2,1,0,1,1] },
  { label: 'Aviso',   color: '#f59e0b', values: [2,1,3,2,2,4,2,3,2,3,4,3] },
  { label: 'Info',    color: '#0f7ee7', values: [1,0,1,1,0,2,1,0,1,1,0,1] },
];

export function SeverityOverTimeChart({ series = severitySeriesDefault, labels }: {
  series?: Series[]; labels?: string[];
} = {}) {
  return <InteractiveLineChart series={series} labels={labels} yTicks={[0,1,2,3,4]} height={260} />;
}
