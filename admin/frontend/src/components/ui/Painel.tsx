'use client';

import { cx } from './partilhado';

export function Panel({ title, subtitle, actions, children, className }: {
  title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={cx('overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-6 p-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="mt-2 text-[14px] leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="border-t border-slate-100 dark:border-slate-700 p-6">{children}</div>
    </section>
  );
}
