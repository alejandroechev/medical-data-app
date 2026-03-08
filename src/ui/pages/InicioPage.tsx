import { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEventos';
import { EventCard } from '../components/EventCard';
import { listActivePatientDrugs } from '../../infra/store-provider';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { formatSchedule } from '../../domain/models/prescription-drug';
import type { PatientDrug } from '../../domain/models/prescription-drug';

interface InicioPageProps {
  onEventClick: (id: string) => void;
}

export function InicioPage({ onEventClick }: InicioPageProps) {
  const { events, loading, error } = useEvents();
  const [activeDrugs, setActiveDrugs] = useState<PatientDrug[]>([]);
  const members = getFamilyMembers();

  useEffect(() => {
    listActivePatientDrugs().then(setActiveDrugs);
  }, []);

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

  if (events.length === 0 && activeDrugs.length === 0) {
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

  // Group active drugs by patient
  const drugsByPatient = new Map<string, PatientDrug[]>();
  activeDrugs.forEach((d) => {
    const list = drugsByPatient.get(d.patientId) ?? [];
    list.push(d);
    drugsByPatient.set(d.patientId, list);
  });

  return (
    <div className="p-4 space-y-3">
      {/* Active treatments widget */}
      {activeDrugs.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-2">
          <h2 className="text-sm font-medium text-indigo-700">
            💊 Tratamientos activos ({activeDrugs.length})
          </h2>
          {Array.from(drugsByPatient.entries()).map(([patientId, drugs]) => {
            const patient = members.find((m) => m.id === patientId);
            return (
              <div key={patientId}>
                <p className="text-xs font-medium text-indigo-600 mt-1">{patient?.name ?? 'Desconocido'}</p>
                {drugs.map((d) => (
                  <p key={d.id} className="text-xs text-indigo-500 ml-2">
                    • {d.name} {d.dosage} — {formatSchedule(d.schedule)}
                    {d.isPermanent && d.nextPickupDate && (
                      <span className="text-indigo-400"> (retiro: {d.nextPickupDate})</span>
                    )}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Eventos recientes
      </h2>
      {events.map((evento) => (
        <EventCard key={evento.id} evento={evento} onClick={onEventClick} />
      ))}
    </div>
  );
}
