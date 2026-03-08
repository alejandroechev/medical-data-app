import { useState } from 'react';
import type { CreatePatientDrugInput, DrugSchedule, DrugDuration } from '../../domain/models/prescription-drug';

interface DrugFormProps {
  patientId: string;
  eventId?: string;
  onSubmit: (input: CreatePatientDrugInput) => Promise<void>;
  onCancel: () => void;
}

export function DrugForm({ patientId, eventId, onSubmit, onCancel }: DrugFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [scheduleType, setScheduleType] = useState<'interval' | 'fixed'>('interval');
  const [intervalHours, setIntervalHours] = useState('8');
  const [fixedTimes, setFixedTimes] = useState<string[]>(['08:00']);
  const [durationType, setDurationType] = useState<'days' | 'indefinite'>('days');
  const [durationDays, setDurationDays] = useState('7');
  const [startDate, setStartDate] = useState(today);
  const [isPermanent, setIsPermanent] = useState(false);
  const [nextPickupDate, setNextPickupDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFixedTime = () => {
    setFixedTimes((prev) => [...prev, '12:00']);
  };

  const removeFixedTime = (index: number) => {
    setFixedTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFixedTime = (index: number, value: string) => {
    setFixedTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !dosage.trim()) {
      setError('Nombre y dosis son obligatorios');
      return;
    }
    if (scheduleType === 'interval' && (!intervalHours || parseInt(intervalHours) <= 0)) {
      setError('Intervalo de horas inválido');
      return;
    }
    if (scheduleType === 'fixed' && fixedTimes.length === 0) {
      setError('Debe agregar al menos un horario');
      return;
    }
    if (durationType === 'days' && (!durationDays || parseInt(durationDays) <= 0)) {
      setError('Días de tratamiento inválidos');
      return;
    }

    const schedule: DrugSchedule = scheduleType === 'interval'
      ? { type: 'interval', intervalHours: parseInt(intervalHours) }
      : { type: 'fixed', times: [...fixedTimes].sort() };

    const duration: DrugDuration = durationType === 'days'
      ? { type: 'days', days: parseInt(durationDays) }
      : { type: 'indefinite' };

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        patientId,
        eventId,
        name: name.trim(),
        dosage: dosage.trim(),
        schedule,
        duration,
        startDate,
        isPermanent,
        nextPickupDate: nextPickupDate || undefined,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 border border-blue-200 rounded-lg p-3 bg-blue-50">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="drug-name" className="block text-xs text-gray-500 mb-1">Medicamento</label>
          <input
            id="drug-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="drug-dosage" className="block text-xs text-gray-500 mb-1">Dosis</label>
          <input
            id="drug-dosage"
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="Ej: 500mg"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Schedule */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Frecuencia</p>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setScheduleType('interval')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              scheduleType === 'interval'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            Cada X horas
          </button>
          <button
            type="button"
            onClick={() => setScheduleType('fixed')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              scheduleType === 'fixed'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            Horarios fijos
          </button>
        </div>

        {scheduleType === 'interval' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Cada</span>
            <input
              type="number"
              value={intervalHours}
              onChange={(e) => setIntervalHours(e.target.value)}
              min="1"
              max="72"
              className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center"
              aria-label="Intervalo en horas"
            />
            <span className="text-xs text-gray-500">horas</span>
          </div>
        ) : (
          <div className="space-y-1">
            {fixedTimes.map((time, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateFixedTime(i, e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  aria-label={`Horario ${i + 1}`}
                />
                {fixedTimes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFixedTime(i)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addFixedTime}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              + Agregar horario
            </button>
          </div>
        )}
      </div>

      {/* Duration */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Duración</p>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setDurationType('days')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              durationType === 'days'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            Por días
          </button>
          <button
            type="button"
            onClick={() => setDurationType('indefinite')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              durationType === 'indefinite'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            Permanente
          </button>
        </div>

        {durationType === 'days' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              min="1"
              className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center"
              aria-label="Días de tratamiento"
            />
            <span className="text-xs text-gray-500">días</span>
          </div>
        )}
      </div>

      {/* Start date */}
      <div>
        <label htmlFor="drug-start" className="block text-xs text-gray-500 mb-1">Inicio tratamiento</label>
        <input
          id="drug-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Permanent prescription */}
      {durationType === 'indefinite' && (
        <>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-700">Receta permanente (retiro periódico)</span>
          </label>

          {isPermanent && (
            <div>
              <label htmlFor="drug-pickup" className="block text-xs text-gray-500 mb-1">Próximo retiro</label>
              <input
                id="drug-pickup"
                type="date"
                value={nextPickupDate}
                onChange={(e) => setNextPickupDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
        </>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Agregar tratamiento'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-300 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
