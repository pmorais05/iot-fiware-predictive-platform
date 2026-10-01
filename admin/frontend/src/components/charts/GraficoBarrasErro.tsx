'use client';

import { useState } from 'react';
import { ErrorsTimelinePoint } from '../../lib/api';
import { FALLBACK_COLORS, toPoints } from '../ui/partilhado';
import { useLang } from '../../lib/lang';

export function ErrorBarsChart({ points, colors = {} }: {
  points: ErrorsTimelinePoint[]; colors?: Record<string, string>;
}) {
  const { t } = useLang();
  const [hovered, setHovered] = useState<{ machineId: string; index: number; value: number } | null>(null);
  const width = 1180; const height = 280; const max = 420;
  const groupWidth = points.length > 0 ? (width - 84) / points.length : 0;
  const labels = points.map((p) => p.time.slice(11, 16));

  return (
    <div className="relative h-[280px] w-full">
      {hovered && (
        <div className="absolute right-4 top-3 z-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-[12px] shadow-lg">
          <div className="font-semibold text-slate-900 dark:text-slate-100">{hovered.machineId}</div>
          <div className="text-slate-500 dark:text-slate-400">{labels[hovered.index]} · {t.alrt.errorCode} {hovered.value}</div>
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Códigos de erro por máquina">
        {[0,100,200,300,400].map((tick) => {
          const y = toPoints([tick], 0, max, width, height)[0].y;
          return (
            <g key={tick}>
              <line x1="42" x2={width-26} y1={y} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="4 4" />
              <text x="10" y={y+4} className="fill-slate-400 dark:fill-slate-500 text-[12px]">{tick}</text>
            </g>
          );
        })}
        {labels.map((label, index) => {
          const x = 42 + (index / Math.max(labels.length - 1, 1)) * (width - 84);
          return (
            <g key={`${label}-${index}`}>
              <line x1={x} x2={x} y1="28" y2={height-34} className="stroke-slate-100 dark:stroke-slate-700/50" />
              {index % 2 === 0 && <text x={x-17} y={height-8} className="fill-slate-400 dark:fill-slate-500 text-[11px]">{label}</text>}
            </g>
          );
        })}
        {points.map((point, index) =>
          point.by_machine.map((entry, machineIndex) => {
            const value = entry.error_code;
            const color = colors[entry.machine_id] ?? FALLBACK_COLORS[machineIndex % FALLBACK_COLORS.length];
            const barHeight = ((height - 62) * value) / max;
            const x = 42 + index * groupWidth + 13 + machineIndex * 12;
            const y = height - 34 - barHeight;
            return (
              <rect key={`${index}-${entry.machine_id}`} x={x} y={y} width="5" height={barHeight} rx="2" fill={color} opacity={value === 0 ? 0 : 0.9}
                onMouseEnter={() => value > 0 && setHovered({ machineId: entry.machine_id, index, value })}
                onMouseLeave={() => setHovered(null)} />
            );
          })
        )}
      </svg>
    </div>
  );
}
