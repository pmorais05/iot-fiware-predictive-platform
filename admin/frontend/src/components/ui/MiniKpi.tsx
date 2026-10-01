'use client';

export function KpiMini({ label, value, accent = 'text-slate-900 dark:text-slate-100', icon }: {
  label: string; value: string; accent?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/40 p-4">
      <div className="flex items-center gap-2 text-[12px] font-medium uppercase text-slate-500 dark:text-slate-400">{icon}{label}</div>
      <div className={`mt-2 text-[22px] font-bold ${accent}`}>{value}</div>
    </div>
  );
}
