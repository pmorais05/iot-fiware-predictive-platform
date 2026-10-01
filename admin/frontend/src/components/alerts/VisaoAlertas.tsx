'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react';
import { useMachines } from '../../lib/useMachines';
import { useSeverityTimeline } from '../../lib/useSeverityTimeline';
import { useErrorsTimeline } from '../../lib/useErrorsTimeline';
import { useAuth } from '../../lib/auth';
import { useLang } from '../../lib/lang';
import { fetchResolvedAlerts, resolveAlert } from '../../lib/api';
import { AlertRow, Series } from '../ui/partilhado';
import { KpiCard } from '../ui/CartaoKpi';
import { Panel } from '../ui/Painel';
import { PageIntro } from '../ui/IntroPagina';
import { SeverityBadge, StatusText } from '../ui/BadgeSeveridade';
import { SeverityOverTimeChart } from '../charts/GraficoSeveridadeTempo';
import { ErrorBarsChart } from '../charts/GraficoBarrasErro';

type AlertItem = AlertRow & { _machineId: string; _errorCode: number };

function alertKey(machineId: string, errorCode: number) {
  return `${machineId}:${errorCode}`;
}

export function AlertsView() {
  const { machines: rows } = useMachines();
  const { t } = useLang();
  const { canResolveAlerts } = useAuth();
  const [resolvedKeys, setResolvedKeys] = useState<Set<string>>(new Set());
  const { points: severityPoints } = useSeverityTimeline(60, 5);
  const { points: errorsPoints }   = useErrorsTimeline(60, 5);
  const openAlertsRef = useRef<AlertItem[]>([]);

  // Carrega alertas já resolvidos do backend (merge, não substituir)
  useEffect(() => {
    fetchResolvedAlerts()
      .then((items) => {
        const keys = items.map((r) => alertKey(r.machine_id, r.error_code));
        setResolvedKeys((prev) => new Set([...prev, ...keys]));
      })
      .catch(() => {});
  }, []);

  // Auto-resolve a cada 15 segundos — apenas estado local, não persiste no backend
  useEffect(() => {
    const interval = setInterval(() => {
      const open = openAlertsRef.current;
      if (open.length === 0) return;
      const keys = open.map((a) => alertKey(a._machineId, a._errorCode));
      setResolvedKeys((prev) => new Set([...prev, ...keys]));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const baseAlerts: AlertItem[] = rows.filter((m) => m.error !== '-').map((m, i) => {
    const errorCode = parseInt(m.error.split('·')[0].replace('E-', '').trim()) || 0;
    const key = alertKey(m.id, errorCode);
    return {
      id: `A-${1000 + i}`,
      machine: m.id,
      occurrence: m.error,
      severity: (m.status === 'Error' ? 'Crítico' : 'Aviso') as AlertRow['severity'],
      status: resolvedKeys.has(key) ? 'Resolvido' as AlertRow['status'] : 'Aberto' as AlertRow['status'],
      firedAt: m.updatedAt,
      _machineId: m.id,
      _errorCode: errorCode,
    };
  });

  // Mantém ref dos alertas abertos para o auto-resolve ler sempre o valor atual
  openAlertsRef.current = baseAlerts.filter((a) => a.status === 'Aberto');

  const open     = baseAlerts.filter((a) => a.status === 'Aberto').length;
  const inReview = baseAlerts.filter((a) => a.status === 'Em análise').length;
  const resolved = baseAlerts.filter((a) => a.status === 'Resolvido').length;
  const colorMap = Object.fromEntries(rows.map((m) => [m.id, m.color]));

  const severityChartSeries: Series[] = [
    { label: t.alrt.critical, color: '#ef4444', values: severityPoints.map((p) => p.error) },
    { label: t.alrt.warning,  color: '#f59e0b', values: severityPoints.map((p) => p.warning) },
  ];
  const severityLabels = severityPoints.map((p) => p.time.slice(11, 16));

  function handleResolve(alert: AlertItem) {
    const key = alertKey(alert._machineId, alert._errorCode);
    setResolvedKeys((prev) => new Set([...prev, key]));
    resolveAlert(alert._machineId, alert._errorCode).catch(() => {});
  }

  return (
    <section className="mx-auto max-w-[1500px]">
      <PageIntro icon={<AlertTriangle size={23} className="text-red-500" />} tint="bg-red-100 dark:bg-red-900/30"
        title={t.alrt.title} description={t.alrt.description} />

      <div className="mt-7 grid grid-cols-3 gap-4">
        <KpiCard label={t.alrt.open}     value={String(open)}     detail={t.alrt.openSub}     icon={<Bell          size={16} className="text-red-500" />} />
        <KpiCard label={t.alrt.inReview} value={String(inReview)} detail={t.alrt.inReviewSub} icon={<AlertTriangle size={16} className="text-amber-500" />} />
        <KpiCard label={t.alrt.resolved} value={String(resolved)} detail={t.alrt.resolvedSub} icon={<CheckCircle2  size={16} className="text-emerald-500" />} />
      </div>

      <Panel className="mt-6" title={t.alrt.severityTitle} subtitle={t.alrt.severitySub}>
        <SeverityOverTimeChart series={severityChartSeries} labels={severityLabels} />
      </Panel>

      <Panel className="mt-6" title={t.alrt.errorsTitle} subtitle={t.alrt.errorsSub}>
        <ErrorBarsChart points={errorsPoints} colors={colorMap} />
      </Panel>

      <Panel className="mt-6" title={t.alrt.histTitle} subtitle={t.alrt.histSub}>
        <table className="w-full table-fixed border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              <th className="w-[110px] py-3">{t.alrt.colId}</th>
              <th className="w-[140px] py-3">{t.alrt.colMachine}</th>
              <th className="py-3">{t.alrt.colOccurrence}</th>
              <th className="w-[170px] py-3">{t.alrt.colSeverity}</th>
              <th className="w-[170px] py-3">{t.alrt.colStatus}</th>
              <th className="w-[130px] py-3">{t.alrt.colFired}</th>
              <th className="w-[120px] py-3 text-right">{t.alrt.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {baseAlerts.map((alert) => (
              <tr key={alert.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                <td className="py-4 font-mono text-[13px] text-slate-900 dark:text-slate-100">{alert.id}</td>
                <td className="py-4 font-mono text-[13px] text-slate-900 dark:text-slate-100">{alert.machine}</td>
                <td className="py-4 text-slate-700 dark:text-slate-300">{alert.occurrence}</td>
                <td className="py-4"><SeverityBadge severity={alert.severity} /></td>
                <td className="py-4"><StatusText status={alert.status} /></td>
                <td className="py-4 text-[13px] text-slate-500 dark:text-slate-400">{alert.firedAt}</td>
                <td className="py-4 text-right">
                  {alert.status !== 'Resolvido' && canResolveAlerts && (
                    <button type="button" onClick={() => handleResolve(alert)}
                      className="h-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-[13px] font-medium text-slate-900 dark:text-slate-100 transition hover:bg-slate-50 dark:hover:bg-slate-600">
                      {t.alrt.resolve}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </section>
  );
}
