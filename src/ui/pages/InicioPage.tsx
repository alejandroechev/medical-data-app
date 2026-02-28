import { useEvents } from '../hooks/useEventos';
import { EventCard } from '../components/EventCard';

interface InicioPageProps {
  onEventClick: (id: string) => void;
}

export function InicioPage({ onEventClick }: InicioPageProps) {
  const { events, loading, error } = useEvents();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <span className="text-4xl mb-3">📋</span>
        <p className="text-gray-500 text-lg">Sin eventos médicos</p>
        <p className="text-gray-400 text-sm mt-1">
          Toca el botón "+" para registrar tu primer evento
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Eventos recientes
      </h2>
      {events.map((evento) => (
        <EventCard key={evento.id} evento={evento} onClick={onEventClick} />
      ))}
    </div>
  );
}
