'use client';

import { Activity, BrainCircuit, Target, TimerReset } from 'lucide-react';
import { useMachines } from '../../lib/useMachines';
import { useLstmMetrics } from '../../lib/useLstmMetrics';
import { useLang } from '../../lib/lang';
import { formatElapsed } from '../ui/partilhado';
import { KpiCard } from '../ui/CartaoKpi';
import { Panel } from '../ui/Painel';
import { PageIntro } from '../ui/IntroPagina';
import { PredictionPanel } from '../charts/PainelPrevisao';
import { FailureProbabilityChart } from '../charts/GraficoProbabilidadeFalha';

export function ForecastView() {
  const { machines: rows } = useMachines();
  const { t } = useLang();
  const { data: metrics } = useLstmMetrics();

  const metricCards = [
    {
      label: t.fore.mae,
      value: metrics.available && metrics.mae != null ? `${metrics.mae.toFixed(2)} kW` : '—',
      detail: metrics.available ? t.fore.maeSub : t.dash.lstmNotAvail,
      icon: <Target size={16} className="text-slate-500 dark:text-slate-400" />,
      badge: metrics.available ? undefined : t.dash.soonBadge,
    },
    {
      label: t.fore.accuracy,
      value: metrics.available && metrics.failure_accuracy != null ? `${(metrics.failure_accuracy * 100).toFixed(1)}%` : '—',
      detail: metrics.available ? t.fore.accuracySub : t.dash.lstmNotAvail,
      icon: <Activity size={16} className="text-slate-500 dark:text-slate-400" />,
      badge: metrics.available ? undefined : t.dash.soonBadge,
    },
    {
      label: t.fore.lastRetrain,
      value: metrics.available ? formatElapsed(metrics.last_trained_at) : '—',
      detail: metrics.available ? t.fore.retrainSub : t.dash.lstmNotAvail,
      icon: <TimerReset size={16} className="text-slate-500 dark:text-slate-400" />,
      badge: metrics.available ? undefined : t.dash.soonBadge,
    },
  ];

  return (
    <section className="mx-auto max-w-[1500px]">
      <PageIntro icon={<BrainCircuit size={23} className="text-violet-600" />} tint="bg-violet-100 dark:bg-violet-900/30"
        title={t.fore.title} description={t.fore.description} />
      <div className="mt-7 grid grid-cols-3 gap-4">
        {metricCards.map((card) => <KpiCard key={card.label} {...card} />)}
      </div>
      <div className="mt-6"><PredictionPanel rows={rows} /></div>
      <div className="mt-6">
        <Panel title={t.fore.failureRisk} subtitle={t.fore.failureRiskSub}>
          <FailureProbabilityChart rows={rows} metrics={metrics} />
        </Panel>
      </div>
    </section>
  );
}
