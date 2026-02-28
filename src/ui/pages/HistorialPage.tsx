import { useState, useMemo } from 'react';
import { useEventos } from '../hooks/useEventos';
import { EventCard } from '../components/EventCard';
import { EVENT_TYPES } from '../../domain/models/medical-event';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import type { MedicalEventFilters } from '../../domain/services/medical-event-repository';

interface HistorialPageProps {
  onEventClick: (id: string) => void;
}

export function HistorialPage({ onEventClick }: HistorialPageProps) {
  const members = getFamilyMembers();
  const [pacienteId, setPacienteId] = useState('');
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const filtros: MedicalEventFilters = useMemo(
    () => ({
      pacienteId: pacienteId || undefined,
      tipo: tipo || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    }),
    [pacienteId, tipo, desde, hasta]
  );

  const { eventos, loading, error } = useEventos(filtros);

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
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-tipo" className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select
              id="filtro-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
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
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="filtro-hasta" className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              id="filtro-hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
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
            {eventos.length} evento{eventos.length !== 1 ? 's' : ''} encontrado{eventos.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {eventos.map((evento) => (
              <EventCard key={evento.id} evento={evento} onClick={onEventClick} />
            ))}
          </div>
          {eventos.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              No se encontraron eventos con los filtros seleccionados
            </p>
          )}
        </>
      )}
    </div>
  );
}
