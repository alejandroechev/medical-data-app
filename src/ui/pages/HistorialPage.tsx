import { useState, useMemo } from 'react';
import { useEvents } from '../hooks/useEventos';
import { EventCard } from '../components/EventCard';
import { EVENT_TYPES } from '../../domain/models/medical-event';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import type { MedicalEventFilters } from '../../domain/services/medical-event-repository';

interface HistorialPageProps {
  onEventClick: (id: string) => void;
}

export function HistorialPage({ onEventClick }: HistorialPageProps) {
  const members = getFamilyMembers();
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reembolso, setReembolso] = useState('');

  const filters: MedicalEventFilters = useMemo(
    () => ({
      patientId: patientId || undefined,
      type: type || undefined,
      from: from || undefined,
      to: to || undefined,
      isapreReimbursed: reembolso === 'isapre' || reembolso === 'ambos' ? true : reembolso === 'ninguno' ? false : undefined,
      insuranceReimbursed: reembolso === 'seguro' || reembolso === 'ambos' ? true : reembolso === 'ninguno' ? false : undefined,
    }),
    [patientId, type, from, to, reembolso]
  );

  const { events, loading, error } = useEvents(filters);

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">Filtros</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="filtro-paciente" className="block text-xs text-gray-500 mb-1">Paciente</label>
            <select
              id="filtro-paciente"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-tipo" className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select
              id="filtro-tipo"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-desde" className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              id="filtro-desde"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="filtro-hasta" className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              id="filtro-hasta"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="filtro-reembolso" className="block text-xs text-gray-500 mb-1">Reembolso</label>
            <select
              id="filtro-reembolso"
              value={reembolso}
              onChange={(e) => setReembolso(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              <option value="isapre">ISAPRE reembolsada</option>
              <option value="seguro">Seguro reembolsado</option>
              <option value="ambos">Ambos reembolsados</option>
              <option value="ninguno">Sin reembolsos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">Buscando...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-xs text-gray-400">
            {events.length} evento{events.length !== 1 ? 's' : ''} encontrado{events.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {events.map((evento) => (
              <EventCard key={evento.id} evento={evento} onClick={onEventClick} />
            ))}
          </div>
          {events.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              No se encontraron eventos con los filtros seleccionados
            </p>
          )}
        </>
      )}
    </div>
  );
}
