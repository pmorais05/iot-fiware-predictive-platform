'use client';

import { Series, cx } from './partilhado';

export function SeriesLegend({ series, disabled, onToggle }: {
  series: Series[]; disabled: string[]; onToggle: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-500 dark:text-slate-400">
      {series.map((item) => (
        <button key={item.label} type="button" onClick={() => onToggle(item.label)}
          className={cx('inline-flex items-center gap-2 rounded-md transition-opacity', disabled.includes(item.label) && 'opacity-35')}>
          <span className="h-2 w-4 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </button>
      ))}
    </div>
  );
}
