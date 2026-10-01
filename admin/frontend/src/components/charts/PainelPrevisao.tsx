'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, ChevronDown, TrendingUp } from 'lucide-react';
import { ChartMachine, HistoryPoint } from '../../lib/api';
import { useMachineHistory } from '../../lib/useMachineHistory';
import { usePredictions } from '../../lib/usePredictions';
import { useLang } from '../../lib/lang';
import { toPointsRange, smoothPathFromPoints, smoothBandPath } from '../ui/partilhado';
import { KpiMini } from '../ui/MiniKpi';
import { Panel } from '../ui/Painel';

type HoverState = { kind: 'hist' | 'forecast'; index: number } | null;

function MachineHistoryCollector({ machineId, onData }: {
  machineId: string;
  onData: (id: string, pts: HistoryPoint[]) => void;
}) {
  const { points } = useMachineHistory(machineId, 'energy', 60);
  useEffect(() => { onData(machineId, points); }, [machineId, points, onData]);
  return null;
}

export { MachineHistoryCollector };

export function PredictionPanel({ rows }: { rows: ChartMachine[] }) {
  const { t } = useLang();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hover, setHover] = useState<HoverState>(null);
  const machine = rows[selectedIndex] ?? rows[0];

  const { points: historyPoints } = useMachineHistory(machine?.id, 'energy', 60);
  const { points: predPoints }    = usePredictions(machine?.id, 60);

  if (!machine) return <div className="flex h-[200px] items-center justify-center text-[14px] text-slate-400 dark:text-slate-500">{t.fore.loadingData}</div>;

  const forecastReady = predPoints.length > 0;

  const width = 1180; const height = 330;
  const PAD_L = 46; const PAD_R = 26; const PAD_Y = 28;
  const NOW_RATIO = 0.50;
  const nowX = PAD_L + NOW_RATIO * (width - PAD_L - PAD_R);

  const histLabels = ['-60m','-52m','-44m','-36m','-28m','-20m','-12m','-4m'];
  const foreLabels = ['+5m','+10m','+15m','+20m','+25m','+30m','+35m','+40m','+45m','+50m','+55m','+60m'];

  const real     = historyPoints.length > 0 ? historyPoints.map((p) => p.value) : machine.history;
  const forecast = forecastReady ? predPoints.map((p) => p.value) : [];
  const minBand  = forecastReady ? predPoints.map((p) => p.min)   : [];
  const maxBand  = forecastReady ? predPoints.map((p) => p.max)   : [];

  const allValues = [...real, ...forecast, ...minBand, ...maxBand];
  const yMax = Math.ceil(Math.max(...allValues, 1) * 1.1);

  const realPoints     = toPointsRange(real,     0, yMax, PAD_L, nowX,           height, PAD_Y);
  const forecastPoints = toPointsRange(forecast, 0, yMax, nowX,  width - PAD_R,  height, PAD_Y);
  const minPoints      = toPointsRange(minBand,  0, yMax, nowX,  width - PAD_R,  height, PAD_Y);
  const maxPoints      = toPointsRange(maxBand,  0, yMax, nowX,  width - PAD_R,  height, PAD_Y);

  const hoverPoint =
    hover?.kind === 'hist'     ? realPoints[hover.index] :
    hover?.kind === 'forecast' ? forecastPoints[hover.index] :
    null;

  return (
    <Panel
      title={t.fore.panelTitle}
      subtitle={t.fore.panelSub}
      actions={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-[13px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-4 rounded-full bg-[#0f7ee7]" />{t.fore.histLabel}</span>
            <span className="inline-flex items-center gap-2">
              <span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /><span className="h-2 w-2 rounded-full bg-violet-500" /></span>
              {t.fore.foreLabel}
            </span>
          </div>
          <label className="relative">
            <select value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="h-10 min-w-[230px] appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 pr-10 text-[14px] text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#0f7ee7] focus:ring-4 focus:ring-blue-500/10">
              {rows.map((item, index) => (<option key={item.id} value={index}>{item.id} · {item.name}</option>))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </label>
        </div>
      }
    >
      {(() => {
        const avgForecast = forecastReady ? forecast.reduce((s, v) => s + v, 0) / forecast.length : null;
        const variationPct = forecastReady && machine.consumption > 0
          ? ((avgForecast! - machine.consumption) / machine.consumption) * 100
          : null;
        return (
          <div className="grid grid-cols-3 gap-4">
            <KpiMini label={t.fore.currentConsumption} value={`${machine.consumption.toFixed(2)} kW`} />
            <KpiMini
              label={t.fore.avgForecast}
              value={forecastReady ? `${avgForecast!.toFixed(2)} kW` : '—'}
              icon={<BrainCircuit size={14} />}
            />
            <KpiMini
              label={t.fore.expectedVar}
              value={forecastReady && variationPct !== null ? `${variationPct >= 0 ? '+' : ''}${variationPct.toFixed(1)}%` : '—'}
              accent={forecastReady && variationPct !== null ? (variationPct >= 0 ? 'text-red-500' : 'text-emerald-600') : undefined}
              icon={<TrendingUp size={15} />}
            />
          </div>
        );
      })()}
      <div className="relative mt-4 h-[330px] overflow-hidden">
        {!forecastReady && (
          <div className="absolute inset-y-0 right-0 z-10 flex w-1/2 flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {t.dash.soonBadge}
            </span>
            <p className="text-[13px] text-slate-400 dark:text-slate-500">{t.dash.lstmNotAvail}</p>
          </div>
        )}
        {hoverPoint && hover && (
          <div className="absolute top-4 z-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-[12px] shadow-lg"
            style={{ left: `min(calc(${(hoverPoint.x/width)*100}% + 8px), calc(100% - 220px))` }}>
            {hover.kind === 'hist' ? (
              <>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{histLabels[Math.min(hover.index, histLabels.length - 1)]}</div>
                <div className="text-slate-500 dark:text-slate-400">{machine.shortName}: {(real[Math.min(hover.index, real.length - 1)] ?? 0).toFixed(2)} kWh</div>
              </>
            ) : (
              <>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {machine.shortName} {foreLabels[Math.min(hover.index, foreLabels.length - 1)]}: {(forecast[hover.index] ?? 0).toFixed(2)} kWh
                </div>
                <div className="text-violet-500 dark:text-violet-400">
                  {t.fore.errorRange}: {(minBand[hover.index] ?? 0).toFixed(2)} – {(maxBand[hover.index] ?? 0).toFixed(2)} kWh
                </div>
              </>
            )}
          </div>
        )}
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Previsão de consumo">
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const tick = Math.round(frac * yMax);
            const y = PAD_Y + (1 - frac) * (height - PAD_Y * 2);
            return (
              <g key={frac}>
                <line x1={PAD_L} x2={width - PAD_R} y1={y} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="4 4" />
                <text x="12" y={y + 4} className="fill-slate-400 dark:fill-slate-500 text-[12px]">{tick}</text>
              </g>
            );
          })}
          {histLabels.map((label, i) => {
            const x = PAD_L + (i / (histLabels.length - 1)) * (nowX - PAD_L);
            return <text key={label} x={x - 14} y={height - 8} className="fill-slate-400 dark:fill-slate-500 text-[11px]">{label}</text>;
          })}
          {foreLabels.map((label, i) => {
            const x = nowX + ((i + 1) / foreLabels.length) * (width - PAD_R - nowX);
            return <text key={label} x={x - 14} y={height - 8} className="fill-violet-400 dark:fill-violet-500 text-[11px]">{label}</text>;
          })}

          <path d={smoothPathFromPoints(realPoints)} fill="none" stroke="none" />
          <path d={`${smoothPathFromPoints(realPoints)} L ${realPoints[realPoints.length-1]?.x.toFixed(1)} ${height-PAD_Y} L ${realPoints[0]?.x.toFixed(1)} ${height-PAD_Y} Z`}
            fill="#0f7ee7" opacity="0.08" />

          <path d={smoothBandPath(maxPoints, minPoints)} fill="#8b5cf6" opacity="0.22" stroke="#a78bfa" strokeOpacity="0.4" strokeWidth="1" />

          <path d={smoothPathFromPoints(realPoints)} fill="none" stroke="#0f7ee7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={smoothPathFromPoints(forecastPoints)} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          <line x1={nowX} x2={nowX} y1="28" y2={height-28} stroke="#64748b" strokeDasharray="3 5" />
          <text x={nowX-22} y="48" className="fill-slate-400 dark:fill-slate-500 text-[11px]">{t.fore.now}</text>

          {[...minPoints, ...maxPoints].map((point, index) => (
            <circle key={`band-${index}`} cx={point.x} cy={point.y} r="2.5" fill="#ef4444" opacity="0.7" />
          ))}

          {realPoints.map((point, index) => (
            <circle key={`real-${index}`} cx={point.x} cy={point.y} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
          ))}
          {forecastPoints.map((point, index) => (
            <circle key={`fore-${index}`} cx={point.x} cy={point.y} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
          ))}

          {realPoints.map((point, index) => (
            <circle key={`hit-real-${index}`} cx={point.x} cy={point.y} r="13" fill="transparent"
              onMouseEnter={() => setHover({ kind: 'hist', index })} onMouseLeave={() => setHover(null)} />
          ))}
          {forecastPoints.map((point, index) => (
            <circle key={`hit-fore-${index}`} cx={point.x} cy={point.y} r="13" fill="transparent"
              onMouseEnter={() => setHover({ kind: 'forecast', index })} onMouseLeave={() => setHover(null)} />
          ))}
        </svg>
      </div>
    </Panel>
  );
}
