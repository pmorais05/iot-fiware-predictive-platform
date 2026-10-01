'use client';

import { AlertRow, cx } from './partilhado';
import { useLang } from '../../lib/lang';

export function SeverityBadge({ severity }: { severity: AlertRow['severity'] }) {
  const { t } = useLang();
  const labelMap: Record<AlertRow['severity'], string> = {
    'Crítico': t.alrt.critical,
    'Aviso':   t.alrt.warning,
    'Info':    t.alrt.info,
  };
  const styleMap: Record<AlertRow['severity'], string> = {
    'Crítico': 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
    'Aviso':   'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    'Info':    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };
  return <span className={cx('rounded-full px-2.5 py-1 text-[12px] font-medium', styleMap[severity])}>{labelMap[severity]}</span>;
}

export function StatusText({ status }: { status: AlertRow['status'] }) {
  const { t } = useLang();
  const labelMap: Record<AlertRow['status'], string> = {
    'Aberto':     t.alrt.statusOpen,
    'Em análise': t.alrt.statusInReview,
    'Resolvido':  t.alrt.statusResolved,
  };
  const styleMap: Record<AlertRow['status'], string> = {
    'Aberto':     'text-red-500',
    'Em análise': 'text-amber-600',
    'Resolvido':  'text-emerald-600',
  };
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-[13px] font-medium', styleMap[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{labelMap[status]}
    </span>
  );
}
