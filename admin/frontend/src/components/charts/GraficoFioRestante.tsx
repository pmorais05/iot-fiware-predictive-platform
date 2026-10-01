'use client';

import { useState } from 'react';
import { ChartMachine } from '../../lib/api';
import { cx } from '../ui/partilhado';
import { useLang } from '../../lib/lang';

export function YarnRemainingChart({ rows }: { rows: ChartMachine[] }) {
  const { t } = useLang();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-4">
      {rows.map((machine) => {
        const isDyeing = machine.type === 'Tingimento';
        const value = isDyeing ? Math.round(machine.chemicalLevel ?? 0) : machine.yarnRemaining;
        const label = isDyeing ? t.fore.chemicalRemaining : t.fore.yarnRemaining;
        const color = value <= 25 ? '#ef4444' : value <= 55 ? '#f59e0b' : '#10b981';
        const circumference = 2 * Math.PI * 48;
        const dash = (value / 100) * circumference;
        return (
          <button key={machine.id} type="button"
            onMouseEnter={() => setHovered(machine.id)} onMouseLeave={() => setHovered(null)}
            className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 p-5 text-left transition hover:border-slate-300 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-700/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{machine.shortName}</div>
                <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{machine.name}</div>
              </div>
              <span className="rounded-full bg-white dark:bg-slate-600 px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-300 shadow-sm">{t.mach.typeLabels[machine.type] ?? machine.type}</span>
            </div>
            <div className="mt-5 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label={`${label} ${machine.shortName}`}>
                <circle cx="60" cy="60" r="48" fill="none" stroke="#e2e8f0" strokeWidth="12" className="stroke-slate-200 dark:stroke-slate-600" />
                <circle cx="60" cy="60" r="48" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`} transform="rotate(-90 60 60)" />
                <text x="60" y="64" textAnchor="middle" className="fill-slate-900 dark:fill-slate-100 text-[22px] font-bold">{value}%</text>
              </svg>
            </div>
            <div className="mt-2 text-center text-[12px] text-slate-500 dark:text-slate-400">{label}</div>
            {hovered === machine.id && (
              <div className="absolute left-4 right-4 top-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-[12px] shadow-lg">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{machine.name}</div>
                <div className="text-slate-500 dark:text-slate-400">{value <= 25 ? t.fore.urgentRefill : t.fore.withinRange}</div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
