'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ChartMachine, deleteMachine, machineControl } from '../../lib/api';
import { useLang } from '../../lib/lang';
import { cx } from '../ui/partilhado';
import { EditMachineModal } from './ModalEditarMaquina';

export function MachineTable({ rows, isAdmin, onControl }: {
  rows: ChartMachine[]; isAdmin: boolean; onControl?: () => void;
}) {
  const { t } = useLang();
  const [pending,       setPending]       = useState<string | null>(null);
  const [confirmStop,   setConfirmStop]   = useState<ChartMachine | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ChartMachine | null>(null);
  const [editMachine,   setEditMachine]   = useState<ChartMachine | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  async function handleControl(machine: ChartMachine) {
    if (!machine.paused) {
      setConfirmStop(machine);
      return;
    }
    setPending(machine.id);
    try {
      await machineControl(machine.id, 'start');
      onControl?.();
    } catch (e) { console.error(e); }
    finally { setPending(null); }
  }

  async function confirmDoStop() {
    if (!confirmStop) return;
    setPending(confirmStop.id);
    setConfirmStop(null);
    try {
      await machineControl(confirmStop.id, 'stop');
      onControl?.();
    } catch (e) { console.error(e); }
    finally { setPending(null); }
  }

  async function confirmDoDelete(purge: boolean) {
    if (!confirmDelete) return;
    setDeleting(true);
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteMachine(target.id, purge);
      window.dispatchEvent(new Event('machines:changed'));
      onControl?.();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  return (
    <>
      {editMachine && (
        <EditMachineModal
          machine={editMachine}
          onClose={() => setEditMachine(null)}
          onSaved={() => { setEditMachine(null); onControl?.(); }}
        />
      )}

      {confirmStop && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45" onClick={() => setConfirmStop(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-slate-100">Parar máquina?</h3>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{confirmStop.name}</span> vai parar de enviar leituras. Pode ser reiniciada a qualquer momento.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmStop(null)}
                className="h-9 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={confirmDoStop}
                className="h-9 rounded-xl bg-red-500 px-4 text-[13px] font-semibold text-white transition hover:bg-red-600">
                Parar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-red-600 dark:text-red-400">Apagar máquina?</h3>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400">
              Vai remover <span className="font-semibold text-slate-700 dark:text-slate-300">{confirmDelete.name}</span> do sistema e do Orion. Esta ação não pode ser desfeita.
            </p>
            <p className="mt-3 text-[13px] text-slate-400 dark:text-slate-500">
              Os dados históricos no CrateDB são mantidos por defeito.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                className="h-9 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={() => confirmDoDelete(false)} disabled={deleting}
                className="h-9 rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-700 px-4 text-[13px] font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 disabled:opacity-50">
                Apagar
              </button>
              <button onClick={() => confirmDoDelete(true)} disabled={deleting}
                className="h-9 rounded-xl bg-red-600 px-4 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                Apagar + dados
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden">
        <table className="w-full table-fixed border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              <th className="w-[110px] py-3">{t.mach.colId}</th>
              <th className="py-3">{t.mach.colMachine}</th>
              <th className="w-[140px] py-3">{t.mach.colStatus}</th>
              <th className="w-[230px] py-3">{t.mach.colYarn}</th>
              <th className="w-[140px] py-3">{t.mach.colConsumption}</th>
              <th className="py-3">{t.mach.colLastError}</th>
              <th className="w-[110px] py-3 text-right">{t.mach.colUpdated}</th>
              {isAdmin && <th className="w-[160px] py-3 text-right">{t.mach.colControl}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((machine) => {
              const isStopped = machine.status === 'Stopped';
              const isRunning = machine.status === 'Running';
              const statusClass = isRunning
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : machine.status === 'Error'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                : isStopped
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
              const barClass = isRunning ? 'bg-emerald-500' : machine.status === 'Error' ? 'bg-red-500' : 'bg-slate-400';
              const statusLabel = isStopped ? t.mach.stopped : machine.status;
              return (
                <tr key={machine.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <td className="py-4 font-mono text-[13px] text-slate-900 dark:text-slate-100">{machine.id}</td>
                  <td className="py-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{machine.name}</div>
                    <div className="text-[12px] text-slate-500 dark:text-slate-400">{t.mach.typeLabels[machine.line] ?? machine.line}</div>
                  </td>
                  <td className="py-4">
                    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium', statusClass)}>
                      <span className={cx('h-1.5 w-1.5 rounded-full', isRunning ? 'bg-emerald-500' : machine.status === 'Error' ? 'bg-red-500' : 'bg-slate-400')} />
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-4">
                    {(() => {
                      const isDyeing = machine.type === 'Tingimento';
                      const rawMaterialPct = isDyeing ? Math.round(machine.chemicalLevel ?? 0) : machine.yarnRemaining;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
                            <div className={cx('h-full rounded-full', barClass)} style={{ width: `${rawMaterialPct}%` }} />
                          </div>
                          <span className="w-10 text-right text-[13px] font-semibold text-slate-900 dark:text-slate-100">{rawMaterialPct}%</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{machine.consumption.toFixed(1)}</span>{' '}
                    <span className="text-[12px] text-slate-500 dark:text-slate-400">kW</span>
                  </td>
                  <td className={cx('py-4 font-mono text-[12px]', machine.error === '-' ? 'text-slate-500 dark:text-slate-400' : machine.status === 'Error' ? 'text-red-500' : 'text-amber-500')}>{machine.error}</td>
                  <td className="py-4 text-right text-[12px] text-slate-500 dark:text-slate-400">{machine.updatedAt}</td>
                  {isAdmin && (
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button onClick={() => setEditMachine(machine)} title="Editar"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleControl(machine)} disabled={pending === machine.id}
                          className={cx(
                            'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition disabled:opacity-50',
                            machine.paused
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50',
                          )}>
                          {machine.paused ? t.mach.startBtn : t.mach.stopBtn}
                        </button>
                        <button onClick={() => setConfirmDelete(machine)} title="Apagar" disabled={deleting}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 disabled:opacity-40">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
