import { useState } from 'react';
import type { PrescriptionDrug } from '../../domain/models/prescription-drug';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

interface PrescriptionDrugListProps {
  drugs: PrescriptionDrug[];
  onAdd: (drug: { name: string; dosage: string; frequency: string; durationDays?: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PrescriptionDrugList({ drugs, onAdd, onDelete }: PrescriptionDrugListProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del medicamento"
            aria-label="Nombre del medicamento"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Dosis (ej: 500mg)"
              aria-label="Dosis"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Frecuencia (ej: cada 8h)"
              aria-label="Frecuencia"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="Días de tratamiento (opcional)"
            aria-label="Días de tratamiento"
            min="1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
