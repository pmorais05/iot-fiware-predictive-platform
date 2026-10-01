'use client';

export function KpiCard({ label, value, detail, icon, badge }: {
  label: string; value: string; detail: string; icon: React.ReactNode; badge?: string;
}) {
  return (
    <div className="min-h-[150px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[12px] font-medium uppercase text-slate-500 dark:text-slate-400">{label}</div>
        <div>{icon}</div>
      </div>
      <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
      <div className="mt-8 flex items-end justify-between gap-4">
        <p className="text-[13px] leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
        {badge && (
          <span className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
