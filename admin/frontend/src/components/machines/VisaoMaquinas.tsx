'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cpu, Gauge, TimerReset, Zap } from 'lucide-react';
import { ChartMachine, HistoryPoint } from '../../lib/api';
import { useMachines } from '../../lib/useMachines';
import { useMachineHistory } from '../../lib/useMachineHistory';
import { useUptime } from '../../lib/useUptime';
import { useEnvironment } from '../../lib/useEnvironment';
import { useAuth } from '../../lib/auth';
import { useLang } from '../../lib/lang';
import { pointsToSeries, cx } from '../ui/partilhado';
import { KpiCard } from '../ui/CartaoKpi';
import { Panel } from '../ui/Painel';
import { PageIntro } from '../ui/IntroPagina';
import { YarnRemainingChart } from '../charts/GraficoFioRestante';
import { InteractiveLineChart } from '../charts/GraficoLinhasInterativo';
import { MachineTable } from './TabelaMaquinas';

function MachineHistoryCollector({ machineId, onData }: {
  machineId: string;
  onData: (id: string, pts: HistoryPoint[]) => void;
}) {
  const { points } = useMachineHistory(machineId, 'energy', 60);
  useEffect(() => { onData(machineId, points); }, [machineId, points, onData]);
  return null;
}

export function MachinesView() {
  const { machines: rows, loading, refresh } = useMachines();
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const { data: uptime } = useUptime();
  const { data: envData } = useEnvironment(60);
  const [filter, setFilter] = useState<'Todos' | 'Running' | 'Error' | 'Offline' | 'Stopped'>('Todos');
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryPoint[]>>({});
  const filteredRows = filter === 'Todos' ? rows : rows.filter((row) => row.status === filter);
  const total = rows.length;
  const totalConsumption = rows.reduce((sum, m) => sum + m.consumption, 0);

  const handleHistoryData = useCallback((id: string, pts: HistoryPoint[]) => {
    setHistoryMap((prev) => (prev[id] === pts ? prev : { ...prev, [id]: pts }));
  }, []);

  const { series: consumedSeries, labels: consumedLabels } = pointsToSeries(
    rows.map((m) => ({ label: m.shortName, color: m.color, points: historyMap[m.id] ?? [] })),
  );

  const filterLabels: Record<string, string> = {
    'Todos': t.mach.all, 'Running': 'Running', 'Error': 'Error', 'Offline': 'Offline', 'Stopped': t.mach.stopped,
  };

  const dyeingMachines = rows.filter((m) => m.type === 'Tingimento');
  const airMachines    = rows.filter((m) => m.type === 'Fiação' || m.type === 'Tecelagem');

  return (
    <section className="mx-auto max-w-[1500px]">
      <PageIntro icon={<Cpu size={23} className="text-[#0f7ee7]" />} tint="bg-blue-100 dark:bg-blue-900/30"
        title={t.mach.title} description={t.mach.description} />

      <div className="mt-7 grid grid-cols-3 gap-4">
        <KpiCard label={t.mach.registeredAgents} value={loading ? '…' : String(total)} detail={`${rows.filter((m) => m.status !== 'Running').length} ${t.mach.withIncident}`} icon={<Gauge size={16} className="text-slate-500 dark:text-slate-400" />} />
        <KpiCard label={t.mach.aggregated} value={loading ? '…' : `${totalConsumption.toFixed(1)} kW`} detail={t.mach.aggregatedSub} icon={<Zap size={16} className="text-slate-500 dark:text-slate-400" />} />
        <KpiCard
          label={t.mach.avgUptime}
          value={uptime.available && uptime.avg_uptime_pct != null ? `${uptime.avg_uptime_pct.toFixed(1)}%` : '—'}
          detail={uptime.available ? t.mach.uptimeSubAvailable : t.mach.uptimeSub}
          icon={<TimerReset size={16} className="text-slate-500 dark:text-slate-400" />}
          badge={uptime.available ? undefined : t.dash.soonBadge}
        />
      </div>

      <Panel className="mt-6" title={t.mach.statusTitle} subtitle={t.mach.statusSub}
        actions={
          <div className="flex items-center gap-2">
            {(['Todos','Running','Error','Offline','Stopped'] as const).map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)}
                className={cx('rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                  filter === item ? 'border-[#0f7ee7] bg-blue-50 dark:bg-blue-900/20 text-[#0f7ee7]' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600')}>
                {filterLabels[item]}
              </button>
            ))}
          </div>
        }>
        <MachineTable rows={filteredRows} isAdmin={isAdmin} onControl={refresh} />
      </Panel>

      <Panel className="mt-6" title={t.mach.yarnTitle} subtitle={t.mach.yarnSub}>
        <YarnRemainingChart rows={rows} />
      </Panel>

      {rows.map((m) => <MachineHistoryCollector key={m.id} machineId={m.id} onData={handleHistoryData} />)}

      <Panel className="mt-6" title={t.mach.energyTitle} subtitle={t.mach.energySub}>
        <InteractiveLineChart series={consumedSeries} labels={consumedLabels} />
      </Panel>

      {dyeingMachines.length > 0 && (
        <Panel className="mt-6" title={t.mach.waterTitle} subtitle={t.mach.waterSub}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dyeingMachines.map((m) => {
              const waterPct = m.waterConsumption !== null ? Math.min(100, (m.waterConsumption / 200) * 100) : 0;
              const chemPct  = m.chemicalLevel ?? 0;
              const chemLow  = chemPct < 20;
              const chemColor = chemLow ? '#ef4444' : chemPct < 50 ? '#f59e0b' : '#10b981';
              return (
                <div key={m.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[14px] text-slate-900 dark:text-slate-100 leading-tight">{m.name}</p>
                      <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{m.id}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 p-2.5">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C6 9 4 13 4 15a8 8 0 0 0 16 0c0-2-2-6-8-13z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">{t.mach.water}</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {m.waterConsumption !== null ? `${m.waterConsumption.toFixed(0)} L` : '—'}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${waterPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>0 L</span><span>200 L</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">{t.mach.chemical}</span>
                        <span className="font-semibold" style={{ color: chemColor }}>
                          {m.chemicalLevel !== null ? `${m.chemicalLevel.toFixed(0)}%` : '—'}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${chemPct}%`, backgroundColor: chemColor }} />
                      </div>
                      {chemLow && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">⚠ Nível baixo — reabastecimento necessário</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {airMachines.length > 0 && (
        <Panel className="mt-6" title={t.mach.airTitle} subtitle={t.mach.airSub}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {airMachines.map((m) => {
              const airVal = m.compressedAir ?? 0;
              const airPct = Math.min(100, (airVal / 1.5) * 100);
              const airColor = airPct > 80 ? '#ef4444' : airPct > 60 ? '#f59e0b' : '#8b5cf6';
              return (
                <div key={m.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[14px] text-slate-900 dark:text-slate-100 leading-tight">{m.name}</p>
                      <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{m.id} · {t.mach.typeLabels[m.type] ?? m.type}</p>
                    </div>
                    <div className="rounded-xl bg-violet-50 dark:bg-violet-900/30 p-2.5">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44l-1-9.96" />
                        <path d="M14.5 22A2.5 2.5 0 0 0 12 19.5v-15a2.5 2.5 0 0 1 4.96.44l1 9.96" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">{t.mach.compressedAir}</span>
                      <span className="font-semibold" style={{ color: airColor }}>
                        {m.compressedAir !== null ? `${m.compressedAir.toFixed(2)} m³/h` : '—'}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${airPct}%`, backgroundColor: airColor }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>0</span><span>1.5 m³/h</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center pt-1">
                    <svg viewBox="0 0 120 70" className="w-32 h-auto">
                      <path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                      <path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke={airColor} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${(airPct / 100) * 157} 157`} />
                      <text x="60" y="60" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200" fontSize="14" fontWeight="700">
                        {airPct.toFixed(0)}%
                      </text>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel className="mt-6" title={t.mach.envTitle} subtitle={t.mach.envSub}>
        {envData.available && envData.north_temp.length > 0 ? (
          <InteractiveLineChart
            series={[
              { label: t.mach.lineNorthTemp, color: '#f59e0b', values: envData.north_temp },
              { label: t.mach.lineSouthTemp, color: '#0f7ee7', values: envData.south_temp },
              { label: t.mach.avgHumidity,   color: '#10b981', values: envData.avg_humidity },
            ]}
            labels={envData.timestamps}
            yTicks={[15, 20, 30, 40, 50, 60, 70]}
          />
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {t.dash.soonBadge}
            </span>
            <p className="text-[13px] text-slate-400 dark:text-slate-500">{t.dash.lstmNotAvail}</p>
          </div>
        )}
      </Panel>
    </section>
  );
}
