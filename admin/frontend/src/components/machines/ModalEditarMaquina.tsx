'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ChartMachine, UpdateMachinePayload, updateMachine } from '../../lib/api';
import { useLang } from '../../lib/lang';

const inputCls = "h-11 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-[15px] font-normal text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-[#0070f3] focus:ring-4 focus:ring-blue-500/10";

export function EditMachineModal({ machine, onClose, onSaved }: {
  machine: ChartMachine;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLang();
  const isTingimento = machine.type === 'Tingimento';
  const isAirType    = machine.type === 'Fiação' || machine.type === 'Tecelagem';

  const [name,         setName]         = useState(machine.name);
  const [baseEnergy,   setBaseEnergy]   = useState(String(machine.baseEnergy));
  const [baseThread,   setBaseThread]   = useState(String(machine.baseThread));
  const [baseWater,    setBaseWater]    = useState(String(machine.baseWater  ?? 125));
  const [baseChemical, setBaseChemical] = useState(String(machine.baseChemical ?? 100));
  const [baseAir,      setBaseAir]      = useState(String(machine.baseAir    ?? 0.9));
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Nome obrigatório'); return; }
    const payload: UpdateMachinePayload = {
      name: name.trim(),
      base_energy: Number(baseEnergy),
      ...(isAirType    ? { base_thread: Number(baseThread), base_air: Number(baseAir) } : {}),
      ...(isTingimento ? { base_thread: Number(baseThread), base_water: Number(baseWater), base_chemical: Number(baseChemical) } : {}),
      ...(!isTingimento && !isAirType ? { base_thread: Number(baseThread) } : {}),
    };
    setSubmitting(true);
    try {
      await updateMachine(machine.id, payload);
      window.dispatchEvent(new Event('machines:changed'));
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-900/45 pt-20 px-4 pb-6"
      onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[600px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-7">
        <button type="button" onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <X size={22} />
        </button>

        <div className="mb-6">
          <h2 className="text-[20px] font-bold text-slate-900 dark:text-slate-100">Editar máquina</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            {machine.id} · <span className="font-medium">{t.mach.typeLabels[machine.type] ?? machine.type}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <label className="col-span-2 flex flex-col gap-2 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
            {t.modal.labelName}
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
          </label>

          <label className="flex flex-col gap-2 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
            {t.modal.limitBase}
            <input type="number" step="0.1" min="0.1" value={baseEnergy} onChange={(e) => setBaseEnergy(e.target.value)} required className={inputCls} />
            <span className="text-[13px] font-normal text-slate-500">kW</span>
          </label>

          {!isTingimento && (
            <label className="flex flex-col gap-2 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
              {t.modal.baseThread}
              <input type="number" step="1" min="1" value={baseThread} onChange={(e) => setBaseThread(e.target.value)} required className={inputCls} />
              <span className="text-[13px] font-normal text-slate-500">m</span>
            </label>
          )}

          {isTingimento && (
            <label className="flex flex-col gap-2 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
              {t.modal.baseThread}
              <input type="number" step="1" min="1" value={baseThread} onChange={(e) => setBaseThread(e.target.value)} required className={inputCls} />
              <span className="text-[13px] font-normal text-slate-500">m</span>
            </label>
          )}

          {isTingimento && (
            <label className="flex flex-col gap-2 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
              {t.modal.baseWater}
              <input type="number" step="1" min="1" value={baseWater} onChange={(e) => setBaseWater(e.target.value)} required className={inputCls} />
              <span className="text-[13px] font-normal text-slate-500">L</span>
            </label>
          )}

          {isTingimento && (
            <label className="flex flex-col gap-2 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
              {t.modal.baseChemical}
              <input type="number" step="1" min="1" max="100" value={baseChemical} onChange={(e) => setBaseChemical(e.target.value)} required className={inputCls} />
              <span className="text-[13px] font-normal text-slate-500">%</span>
            </label>
          )}

          {isAirType && (
            <label className="flex flex-col gap-2 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
              {t.modal.baseAir}
              <input type="number" step="0.1" min="0.1" value={baseAir} onChange={(e) => setBaseAir(e.target.value)} required className={inputCls} />
              <span className="text-[13px] font-normal text-slate-500">m³/h</span>
            </label>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[13px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={submitting}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-5 text-[14px] font-semibold text-slate-800 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50">
            {t.modal.btnCancel}
          </button>
          <button type="submit" disabled={submitting}
            className="h-10 rounded-xl bg-[#0070f3] px-5 text-[14px] font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60">
            {submitting ? 'A guardar…' : 'Guardar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
