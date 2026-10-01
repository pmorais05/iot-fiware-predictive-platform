'use client';

import { useState } from 'react';
import { ChartMachine, LstmMetrics } from '../../lib/api';
import { useLang } from '../../lib/lang';

export function FailureProbabilityChart({ rows, metrics }: { rows: ChartMachine[]; metrics?: LstmMetrics }) {
  const { t } = useLang();
  const [hovered, setHovered] = useState<string | null>(null);

  const byMachine = new Map((metrics?.machines ?? []).map((m) => [m.machine_id, m]));

  return (
    <div className="space-y-5">
      {rows.map((machine) => {
        const real = byMachine.get(machine.id)?.failure_probability;
        const value = real != null ? Math.round(real * 100) : machine.failureProbability;
        const isReal = real != null;
        const color = value >= 65 ? '#ef4444' : value >= 35 ? '#f59e0b' : '#10b981';
        return (
          <div key={machine.id} className="relative">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{machine.shortName}</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">{t.mach.typeLabels[machine.type] ?? machine.type} · {machine.status}</div>
              </div>
              <div className="font-mono text-[18px] font-bold" style={{ color }}>{value}%</div>
            </div>
            <div className="h-4 rounded-full bg-slate-100 dark:bg-slate-700" onMouseEnter={() => setHovered(machine.id)} onMouseLeave={() => setHovered(null)}>
              <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
            </div>
            {hovered === machine.id && (
              <div className="absolute right-0 top-12 z-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-[12px] shadow-lg">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{machine.name}</div>
                <div className="text-slate-500 dark:text-slate-400">{t.fore.failureProb}: {value}%</div>
                <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {isReal ? t.fore.modelOutput : t.dash.lstmNotAvail}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
