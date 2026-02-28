import { useState } from 'react';
import type { CreateMedicalEventInput, EventType } from '../../domain/models/medical-event';
import { EVENT_TYPES } from '../../domain/models/medical-event';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { validateCreateEvent } from '../../domain/validators/medical-event-validator';

interface EventFormProps {
  onSubmit: (input: CreateMedicalEventInput) => Promise<void>;
  loading?: boolean;
}

export function EventForm({ onSubmit, loading }: EventFormProps) {
  const members = getFamilyMembers();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [type, setType] = useState<EventType>('Consulta Médica');
  const [description, setDescription] = useState('');
  const [patientId, setPatientId] = useState(members[0]?.id ?? '');
  const [isapreReimbursed, setIsapreReimbursed] = useState(false);
  const [insuranceReimbursed, setInsuranceReimbursed] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores([]);

    const input: CreateMedicalEventInput = {
      date,
      type,
      description,
      patientId,
      isapreReimbursed,
      insuranceReimbursed,
    };

    const validation = validateCreateEvent(input);
    if (!validation.valid) {
      setErrores(validation.errors.map((e) => e.message));
      return;
    }

    try {
      await onSubmit(input);
      // Reset form
      setDescription('');
      setIsapreReimbursed(false);
      setInsuranceReimbursed(false);
    } catch (err) {
      setErrores([(err as Error).message]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errores.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {errores.map((e, i) => (
            <p key={i} className="text-sm text-red-600">{e}</p>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
          Fecha
        </label>
        <input
          id="fecha"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de evento
        </label>
        <select
          id="tipo"
          value={type}
          onChange={(e) => setType(e.target.value as EventType)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="paciente" className="block text-sm font-medium text-gray-700 mb-1">
          Paciente
        </label>
        <select
          id="paciente"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="descripcion"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe el evento médico..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Reembolsos</p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isapreReimbursed}
            onChange={(e) => setIsapreReimbursed(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Reembolsado por ISAPRE</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={insuranceReimbursed}
            onChange={(e) => setInsuranceReimbursed(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Reembolsado por Seguro Complementario</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Guardando...' : 'Guardar Evento'}
      </button>
    </form>
  );
}
