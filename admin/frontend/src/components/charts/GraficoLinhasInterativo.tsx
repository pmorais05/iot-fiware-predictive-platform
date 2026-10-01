'use client';

import { useState } from 'react';
import { Series, times, toPoints, pathFromPoints, cx } from '../ui/partilhado';
import { SeriesLegend } from '../ui/LegendaSeries';

export function InteractiveLineChart({ series, labels = times, yTicks = [0,2,4,6,8], height = 280 }: {
  series: Series[]; labels?: string[]; yTicks?: number[]; height?: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [disabled, setDisabled] = useState<string[]>([]);
  const activeSeries = series.filter((item) => !disabled.includes(item.label));
  const width  = 1180;
  const values = activeSeries.flatMap((item) => item.values);
  const min    = Math.min(0, ...values, ...yTicks);
  const max    = Math.max(...values, ...yTicks);
  const hoverX = hoverIndex === null ? 0 : 42 + (hoverIndex / Math.max(labels.length - 1, 1)) * (width - 84);

  const toggleSeries = (label: string) => {
    setDisabled((cur) => cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label]);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <SeriesLegend series={series} disabled={disabled} onToggle={toggleSeries} />
      </div>
      <div className="relative h-[280px] w-full overflow-hidden">
        {hoverIndex !== null && (
          <div className="pointer-events-none absolute top-3 z-10 min-w-[150px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-[12px] shadow-lg"
            style={{ left: `min(calc(${(hoverX/width)*100}% + 8px), calc(100% - 170px))` }}>
            <div className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{labels[hoverIndex]}</div>
            {activeSeries.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}
                </span>
                <span className="font-mono">{item.values[hoverIndex]?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Gráfico interativo" onMouseLeave={() => setHoverIndex(null)}>
          {yTicks.map((tick) => {
            const y = toPoints([tick], min, max, width, height)[0].y;
            return (
              <g key={tick}>
                <line x1="42" x2={width-26} y1={y} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="4 4" />
                <text x="12" y={y+4} className="fill-slate-400 dark:fill-slate-500 text-[12px]">{tick}</text>
              </g>
            );
          })}
          {labels.map((label, index) => {
            const x = 42 + (index / Math.max(labels.length - 1, 1)) * (width - 84);
            return (
              <g key={`${label}-${index}`}>
                <line x1={x} x2={x} y1="28" y2={height-34} className="stroke-slate-100 dark:stroke-slate-700/50" />
                {index % 2 === 0 && <text x={x-18} y={height-8} className="fill-slate-400 dark:fill-slate-500 text-[11px]">{label}</text>}
                <rect x={x-22} y="0" width="44" height={height} fill="transparent" onMouseEnter={() => setHoverIndex(index)} />
              </g>
            );
          })}
          {hoverIndex !== null && <line x1={hoverX} x2={hoverX} y1="28" y2={height-34} stroke="#94a3b8" strokeDasharray="3 4" />}
          {activeSeries.map((item) => {
            const pts = toPoints(item.values, min, max, width, height);
            return (
              <g key={item.label}>
                <path d={pathFromPoints(pts)} fill="none" stroke={item.color} strokeDasharray={item.dashed ? '7 7' : undefined} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                {hoverIndex !== null && pts[hoverIndex] && (
                  <circle cx={pts[hoverIndex].x} cy={pts[hoverIndex].y} r="5" fill="white" stroke={item.color} strokeWidth="3" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
