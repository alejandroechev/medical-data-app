import { useState, useEffect } from 'react';
import type { PrescriptionDrug } from '../../domain/models/prescription-drug';
import { listAllPrescriptionDrugs } from '../../infra/store-provider';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

interface PrescriptionDrugListProps {
  drugs: PrescriptionDrug[];
  onAdd: (drug: { name: string; dosage: string; frequency: string; durationDays?: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function PrescriptionDrugList({ drugs, onAdd, onDelete }: PrescriptionDrugListProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allDrugs, setAllDrugs] = useState<PrescriptionDrug[]>([]);

  useEffect(() => {
    if (showForm) {
      listAllPrescriptionDrugs().then(setAllDrugs);
    }
  }, [showForm]);

  const knownNames = uniqueSorted(allDrugs.map((d) => d.name));
  const knownDosages = uniqueSorted(allDrugs.filter((d) => !name || d.name === name).map((d) => d.dosage));
  const knownFrequencies = uniqueSorted(allDrugs.filter((d) => !name || d.name === name).map((d) => d.frequency));
  const knownDurations = uniqueSorted(
    allDrugs
      .filter((d) => !name || d.name === name)
      .map((d) => d.durationDays)
      .filter((d): d is number => d !== undefined)
      .map(String)
  );

  const handleSelectName = (selected: string) => {
    setName(selected);
    // Auto-fill dosage/frequency from the most recent matching drug
    const match = allDrugs.find((d) => d.name === selected);
    if (match) {
      setDosage(match.dosage);
      setFrequency(match.frequency);
      if (match.durationDays) setDurationDays(String(match.durationDays));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !dosage.trim() || !frequency.trim()) {
      setError('Nombre, dosis y frecuencia son obligatorios');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        durationDays: durationDays ? parseInt(durationDays, 10) : undefined,
      });
      setName('');
      setDosage('');
      setFrequency('');
      setDurationDays('');
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        💊 Medicamentos ({drugs.length})
      </h3>

      {drugs.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-2">
          Sin medicamentos registrados
        </p>
      )}

      {drugs.length > 0 && (
        <div className="space-y-2 mb-3">
          {drugs.map((drug) => (
            <div
              key={drug.id}
              className="flex items-start justify-between gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{drug.name}</p>
                <p className="text-xs text-gray-500">
                  {drug.dosage} — {drug.frequency}
                  {drug.durationDays && ` — ${drug.durationDays} días`}
                </p>
              </div>
              <ConfirmDeleteButton
                onConfirm={() => onDelete(drug.id)}
                label={`Eliminar ${drug.name}`}
              />
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div>
            <label htmlFor="drug-name" className="block text-xs text-gray-500 mb-1">Medicamento</label>
            <input
              id="drug-name"
              list="drug-names"
              type="text"
              value={name}
              onChange={(e) => handleSelectName(e.target.value)}
              placeholder="Nombre del medicamento"
              aria-label="Nombre del medicamento"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <datalist id="drug-names">
              {knownNames.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="drug-dosage" className="block text-xs text-gray-500 mb-1">Dosis</label>
              <input
                id="drug-dosage"
                list="drug-dosages"
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Ej: 500mg"
                aria-label="Dosis"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <datalist id="drug-dosages">
                {knownDosages.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div>
              <label htmlFor="drug-frequency" className="block text-xs text-gray-500 mb-1">Frecuencia</label>
              <input
                id="drug-frequency"
                list="drug-frequencies"
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="Ej: cada 8h"
                aria-label="Frecuencia"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <datalist id="drug-frequencies">
                {knownFrequencies.map((f) => <option key={f} value={f} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label htmlFor="drug-duration" className="block text-xs text-gray-500 mb-1">Días de tratamiento</label>
            <input
              id="drug-duration"
              list="drug-durations"
              type="text"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="Opcional"
              aria-label="Días de tratamiento"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <datalist id="drug-durations">
              {knownDurations.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Agregar'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); }}
              className="flex-1 border border-gray-300 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 border border-blue-200 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
        >
          + Agregar medicamento
        </button>
      )}
    </div>
  );
}
