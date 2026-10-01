'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, Bell, CheckCircle2, Cpu, Zap } from 'lucide-react';
import { useMachines } from '../../lib/useMachines';
import { useSeverityTimeline } from '../../lib/useSeverityTimeline';
import { useAuth } from '../../lib/auth';
import { useLang } from '../../lib/lang';
import { fetchResolvedAlerts, resolveAlert } from '../../lib/api';
import { AlertRow, Series, cx } from '../ui/partilhado';
import { KpiCard } from '../ui/CartaoKpi';
import { Panel } from '../ui/Painel';
import { PageIntro } from '../ui/IntroPagina';
import { SeverityBadge } from '../ui/BadgeSeveridade';
import { SeverityOverTimeChart } from '../charts/GraficoSeveridadeTempo';

type AlertItem = AlertRow & { _machineId: string; _errorCode: number };

function alertKey(machineId: string, errorCode: number) {
  return `${machineId}:${errorCode}`;
}

export function MaintenanceOverview() {
  const { machines: rows, loading } = useMachines();
  const { canResolveAlerts } = useAuth();
  const { t } = useLang();
  const { points: severityPoints } = useSeverityTimeline(60, 5);
  const [resolvedKeys, setResolvedKeys] = useState<Set<string>>(new Set());
  const openAlertsRef = useRef<AlertItem[]>([]);

  useEffect(() => {
    fetchResolvedAlerts()
      .then((items) => {
        const keys = items.map((r) => alertKey(r.machine_id, r.error_code));
        setResolvedKeys((prev) => new Set([...prev, ...keys]));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const open = openAlertsRef.current;
      if (open.length === 0) return;
      const keys = open.map((a) => alertKey(a._machineId, a._errorCode));
      setResolvedKeys((prev) => new Set([...prev, ...keys]));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const total            = rows.length;
  const running          = rows.filter((m) => m.status === 'Running').length;
  const errors           = rows.filter((m) => m.status === 'Error').length;
  const totalConsumption = rows.reduce((s, m) => s + m.consumption, 0);

  const problemMachines = rows
    .filter((m) => m.status !== 'Running')
    .sort((a, b) => {
      const rank: Record<string, number> = { Error: 2, Offline: 1, Stopped: 0 };
      return (rank[b.status] ?? 0) - (rank[a.status] ?? 0);
    });

  const baseAlerts: AlertItem[] = rows.filter((m) => m.error !== '-').map((m, i) => {
    const errorCode = parseInt(m.error.split('·')[0].replace('E-', '').trim()) || 0;
    const key = alertKey(m.id, errorCode);
    return {
      id: `A-${1000 + i}`, machine: m.id, occurrence: m.error,
      severity: (m.status === 'Error' ? 'Crítico' : 'Aviso') as AlertRow['severity'],
      status: resolvedKeys.has(key) ? 'Resolvido' as AlertRow['status'] : 'Aberto' as AlertRow['status'],
      firedAt: m.updatedAt,
      _machineId: m.id,
      _errorCode: errorCode,
    };
  });

  openAlertsRef.current = baseAlerts.filter((a) => a.status === 'Aberto');

  const openAlerts    = baseAlerts.filter((a) => a.status === 'Aberto');
  const resolvedCount = baseAlerts.filter((a) => a.status === 'Resolvido').length;

  function handleResolve(alert: AlertItem) {
    const key = alertKey(alert._machineId, alert._errorCode);
    setResolvedKeys((prev) => new Set([...prev, key]));
    resolveAlert(alert._machineId, alert._errorCode).catch(() => {});
  }

  const severityChartSeries: Series[] = [
    { label: t.alrt.critical, color: '#ef4444', values: severityPoints.map((p) => p.error) },
    { label: t.alrt.warning,  color: '#f59e0b', values: severityPoints.map((p) => p.warning) },
  ];
  const severityLabels = severityPoints.map((p) => p.time.slice(11, 16));

  const statusStyle = (status: string) => {
    if (status === 'Running') return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    if (status === 'Error')   return 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400';
    if (status === 'Stopped') return 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
  };

  return (
    <section className="mx-auto max-w-[1500px]">
      <PageIntro
        icon={<Cpu size={23} className="text-amber-500" />}
        tint="bg-amber-100 dark:bg-amber-900/30"
        title="Visão Geral · Manutenção"
        description="Estado atual das máquinas e alertas ativos na fábrica"
      />

      <div className="mt-7 grid grid-cols-4 gap-4">
        <KpiCard
          label={t.dash.factoryStatus}
          value={loading ? '…' : `${running} / ${total} ${t.dash.operational}`}
          detail={loading ? '' : `${total - running} ${t.dash.outOfService}`}
          icon={<Activity size={16} className="text-slate-500 dark:text-slate-400" />}
        />
        <KpiCard
          label="Máquinas com erro"
          value={loading ? '…' : String(errors)}
          detail={errors === 0 ? 'Nenhum erro ativo' : `${errors} requer${errors === 1 ? '' : 'em'} intervenção`}
          icon={<AlertTriangle size={16} className={errors > 0 ? 'text-red-500' : 'text-slate-400'} />}
          badge={errors > 0 ? String(errors) : undefined}
        />
        <KpiCard
          label={t.mach.aggregated}
          value={loading ? '…' : `${totalConsumption.toFixed(1)} kW`}
          detail={t.mach.aggregatedSub}
          icon={<Zap size={16} className="text-slate-500 dark:text-slate-400" />}
        />
        <KpiCard
          label={t.alrt.open}
          value={String(openAlerts.length)}
          detail={resolvedCount > 0 ? `${resolvedCount} resolvidos nesta sessão` : t.alrt.openSub}
          icon={<Bell size={16} className={openAlerts.length > 0 ? 'text-red-500' : 'text-slate-400'} />}
        />
      </div>

      <Panel className="mt-6" title={t.mach.statusTitle} subtitle="Todas as máquinas · apenas leitura">
        <table className="w-full table-fixed border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              <th className="py-3">{t.mach.colMachine}</th>
              <th className="w-[140px] py-3">{t.mach.colStatus}</th>
              <th className="w-[230px] py-3">{t.mach.colYarn}</th>
              <th className="w-[150px] py-3">{t.mach.colConsumption}</th>
              <th className="py-3">{t.mach.colLastError}</th>
              <th className="w-[110px] py-3 text-right">{t.mach.colUpdated}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((machine) => {
              const isDyeing = machine.type === 'Tingimento';
              const rawMaterialPct = isDyeing ? Math.round(machine.chemicalLevel ?? 0) : machine.yarnRemaining;
              const barClass = machine.status === 'Running' ? 'bg-emerald-500' : machine.status === 'Error' ? 'bg-red-500' : 'bg-slate-400';
              const statusLabel = machine.status === 'Stopped' ? t.mach.stopped : machine.status;
              return (
                <tr key={machine.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <td className="py-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{machine.name}</div>
                    <div className="text-[12px] text-slate-500 dark:text-slate-400">{t.mach.typeLabels[machine.line] ?? machine.line}</div>
                  </td>
                  <td className="py-4">
                    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium', statusStyle(machine.status))}>
                      <span className={cx('h-1.5 w-1.5 rounded-full', barClass)} />
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className={cx('h-full rounded-full', barClass)} style={{ width: `${rawMaterialPct}%` }} />
                      </div>
                      <span className="w-10 text-right text-[13px] font-semibold text-slate-900 dark:text-slate-100">{rawMaterialPct}%</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{machine.consumption.toFixed(1)}</span>{' '}
                    <span className="text-[12px] text-slate-500 dark:text-slate-400">kW</span>
                  </td>
                  <td className={cx('py-4 font-mono text-[12px]', machine.error === '-' ? 'text-slate-500 dark:text-slate-400' : machine.status === 'Error' ? 'text-red-500' : 'text-amber-500')}>
                    {machine.error}
                  </td>
                  <td className="py-4 text-right text-[12px] text-slate-500 dark:text-slate-400">{machine.updatedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <div className="mt-6 grid grid-cols-[1.2fr_0.8fr] gap-4">
        <Panel title={t.alrt.histTitle} subtitle={`${openAlerts.length} abertos · ${resolvedCount} resolvidos nesta sessão`}>
          {openAlerts.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-12 text-emerald-600 dark:text-emerald-400 text-[14px] font-medium">
              <CheckCircle2 size={18} />
              {t.dash.noAlerts}
            </div>
          ) : (
            <div className="space-y-3">
              {openAlerts.map((alert) => (
                <div key={alert.id} className={cx(
                  'flex items-center justify-between gap-4 rounded-xl border px-4 py-3',
                  alert.severity === 'Crítico'
                    ? 'border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10'
                    : 'border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10',
                )}>
                  <div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <span className="font-mono text-[12px] text-slate-500 dark:text-slate-400">{alert.machine}</span>
                    </div>
                    <div className="mt-1.5 text-[14px] font-semibold text-slate-900 dark:text-slate-100">{alert.occurrence}</div>
                    <div className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">{alert.firedAt}</div>
                  </div>
                  {canResolveAlerts && (
                    <button type="button"
                      onClick={() => handleResolve(alert)}
                      className="shrink-0 h-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-[13px] font-medium text-slate-900 dark:text-slate-100 transition hover:bg-slate-50 dark:hover:bg-slate-600">
                      {t.alrt.resolve}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={t.alrt.severityTitle} subtitle={t.alrt.severitySub}>
          <SeverityOverTimeChart series={severityChartSeries} labels={severityLabels} />
        </Panel>
      </div>
    </section>
  );
}
