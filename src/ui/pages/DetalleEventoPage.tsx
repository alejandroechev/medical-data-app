import { useEffect, useState, useCallback } from 'react';
import { getEventById, listPhotosByEvent, linkPhoto, unlinkPhoto, updateEvent, deleteEvent } from '../../infra/store-provider';
import { getFamilyMemberById } from '../../infra/supabase/family-member-store';
import { PhotoLinker } from '../components/PhotoLinker';
import { EventActions } from '../components/EventActions';
import { EditableDescription } from '../components/EditableDescription';
import type { MedicalEvent } from '../../domain/models/medical-event';
import type { EventPhoto, LinkPhotoInput } from '../../domain/models/event-photo';

interface DetalleEventoPageProps {
  eventoId: string;
  onDeleted?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  'Consulta Médica': '🩺',
  'Consulta Dental': '🦷',
  'Urgencia': '🚑',
  'Cirugía': '🏥',
  'Examen': '🔬',
  'Otro': '📋',
};

export function DetalleEventoPage({ eventoId, onDeleted }: DetalleEventoPageProps) {
  const [evento, setEvento] = useState<MedicalEvent | null>(null);
  const [fotos, setFotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadPhotos = useCallback(async () => {
    const ph = await listPhotosByEvent(eventoId);
    setFotos(ph);
  }, [eventoId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ev, ph] = await Promise.all([
          getEventById(eventoId),
          listPhotosByEvent(eventoId),
        ]);
        setEvento(ev);
        setFotos(ph);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventoId]);

  const handleLinkPhoto = async (input: LinkPhotoInput) => {
    await linkPhoto(input);
    await reloadPhotos();
  };

  const handleUnlinkPhoto = async (photoId: string) => {
    await unlinkPhoto(photoId);
    await reloadPhotos();
  };

  const handleDelete = async () => {
    await deleteEvent(eventoId);
    onDeleted?.();
  };

  const handleToggleIsapre = async (value: boolean) => {
    const updated = await updateEvent(eventoId, { isapreReimbursed: value });
    setEvento(updated);
  };

  const handleToggleInsurance = async (value: boolean) => {
    const updated = await updateEvent(eventoId, { insuranceReimbursed: value });
    setEvento(updated);
  };

  const handleUpdateDescription = async (newDescription: string) => {
    const updated = await updateEvent(eventoId, { description: newDescription });
    setEvento(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error ?? 'Evento no encontrado'}</p>
        </div>
      </div>
    );
  }

  const paciente = getFamilyMemberById(evento.patientId);
  const icon = TYPE_ICONS[evento.type] ?? '📋';

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{evento.type}</h2>
            <p className="text-sm text-gray-500">{evento.date}</p>
          </div>
        </div>
        <EditableDescription value={evento.description} onSave={handleUpdateDescription} />
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Paciente</span>
          <span className="text-sm font-medium">{paciente?.name ?? 'Desconocido'}</span>
        </div>
      </div>

      {/* Reembolsos & Delete */}
      <EventActions
        isapreReimbursed={evento.isapreReimbursed}
        insuranceReimbursed={evento.insuranceReimbursed}
        onDelete={handleDelete}
        onToggleIsapre={handleToggleIsapre}
        onToggleInsurance={handleToggleInsurance}
      />

      {/* Photos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Documentos ({fotos.length})
        </h3>
        {fotos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Sin documentos vinculados
          </p>
        ) : (
          <div className="space-y-2 mb-3">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">📷</span>
                <a
                  href={foto.googlePhotosUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-blue-600 underline truncate"
                >
                  {foto.description ?? foto.googlePhotosId}
                </a>
                <button
                  onClick={() => handleUnlinkPhoto(foto.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                  aria-label={`Desvincular ${foto.description ?? foto.googlePhotosId}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <PhotoLinker eventId={eventoId} onPhotoLinked={handleLinkPhoto} />
      </div>
    </div>
  );
}
