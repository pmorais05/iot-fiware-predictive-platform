'use client';

import { Activity, AlertTriangle, BrainCircuit, Zap } from 'lucide-react';
import { useMachines } from '../../lib/useMachines';
import { useEnergyToday } from '../../lib/useEnergyToday';
import { useLstmMetrics } from '../../lib/useLstmMetrics';
import { useNextHourForecast } from '../../lib/useNextHourForecast';
import { useLang } from '../../lib/lang';
import { AlertRow, cx } from '../ui/partilhado';
import { KpiCard } from '../ui/CartaoKpi';
import { Panel } from '../ui/Painel';
import { SeverityBadge, StatusText } from '../ui/BadgeSeveridade';
import { PredictionPanel } from '../charts/PainelPrevisao';
import { FailureProbabilityChart } from '../charts/GraficoProbabilidadeFalha';

export function DashboardOverview() {
  const { machines: rows, loading } = useMachines();
  const { data: energyData } = useEnergyToday();
  const { data: lstmMetrics } = useLstmMetrics();
  const { forecastKwh, available: forecastAvailable } = useNextHourForecast(rows.map((m) => m.id));
  const { t } = useLang();

  const currentKwh = rows.reduce((sum, m) => sum + m.consumption, 0);
  const forecastVariationPct = forecastAvailable && currentKwh > 0
    ? ((forecastKwh - currentKwh) / currentKwh) * 100
    : null;

  const total   = rows.length;
  const running = rows.filter((m) => m.status === 'Running').length;
  const worstMachine = rows.filter((m) => m.status !== 'Running').sort((a, b) => {
    const rank: Record<string, number> = { Error: 2, Offline: 1, Running: 0 };
    return (rank[b.status] ?? 0) - (rank[a.status] ?? 0);
  })[0] ?? null;

  const latestAlerts: AlertRow[] = rows.filter((m) => m.error !== '-').map((m, i) => ({
    id: `A-${1000 + i}`, machine: m.id, occurrence: m.error,
    severity: (m.status === 'Error' ? 'Crítico' : 'Aviso') as AlertRow['severity'],
    status: 'Aberto' as AlertRow['status'], firedAt: m.updatedAt,
  })).slice(0, 3);

  return (
    <section className="mx-auto max-w-[1500px]">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label={t.dash.energyToday}
          value={energyData ? `${energyData.total_kwh.toFixed(1)} kWh` : '—'}
          detail={energyData ? t.dash.energyMachines(energyData.by_machine.length, (energyData.total_kwh / energyData.by_machine.length).toFixed(1)) : t.dash.loading}
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-[#0f7ee7]"><Zap size={20} /></span>}
          badge={energyData ? undefined : t.dash.soonBadge}
        />
        <KpiCard
          label={t.dash.factoryStatus}
          value={loading ? '…' : `${running} / ${total} ${t.dash.operational}`}
          detail={loading ? '' : `${total - running} ${t.dash.outOfService}`}
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"><Activity size={20} /></span>}
        />
        <KpiCard
          label={t.dash.latestAlert}
          value={loading ? '…' : worstMachine ? `${worstMachine.error !== '-' ? worstMachine.error.split(' · ')[0] : worstMachine.status.toUpperCase()} · ${worstMachine.name}` : t.dash.noAlerts}
          detail={worstMachine?.error !== '-' ? worstMachine?.error ?? '' : t.dash.allOperational}
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500"><AlertTriangle size={20} /></span>}
          badge={worstMachine?.status === 'Error' ? t.dash.critical : undefined}
        />
        <KpiCard
          label={t.dash.nextHourForecast}
          value={forecastAvailable ? `${forecastKwh.toFixed(1)} kWh` : '—'}
          detail={forecastAvailable
            ? `${forecastVariationPct != null && forecastVariationPct >= 0 ? '+' : ''}${forecastVariationPct?.toFixed(1) ?? '0.0'}% vs ${t.fore.currentConsumption.toLowerCase()}`
            : t.dash.lstmNotAvail}
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600"><BrainCircuit size={20} /></span>}
          badge={forecastAvailable ? undefined : t.dash.soonBadge}
        />
      </div>

      <div className="mt-6"><PredictionPanel rows={rows} /></div>

      <div className="mt-6 grid grid-cols-[0.85fr_1.15fr] gap-4">
        <Panel title={t.dash.opRisk} subtitle={t.dash.opRiskSub}>
          <FailureProbabilityChart rows={rows} metrics={lstmMetrics} />
        </Panel>
        <Panel title={t.dash.latestEvents} subtitle={t.dash.latestEventsSub}>
          <div className="space-y-3">
            {latestAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/30 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="font-mono text-[12px] text-slate-500 dark:text-slate-400">{alert.id}</span>
                  </div>
                  <div className="mt-2 text-[14px] font-semibold text-slate-900 dark:text-slate-100">{alert.occurrence}</div>
                  <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{alert.machine} · {alert.firedAt}</div>
                </div>
                <StatusText status={alert.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}
