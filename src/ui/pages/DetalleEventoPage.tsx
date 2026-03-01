import { useEffect, useState, useCallback } from 'react';
import { getEventById, listPhotosByEvent, linkPhoto, unlinkPhoto, updateEvent, deleteEvent, uploadPhoto, createRecording, listRecordingsByEvent, deleteRecording } from '../../infra/store-provider';
import { getFamilyMemberById } from '../../infra/supabase/family-member-store';
import { PhotoLinker } from '../components/PhotoLinker';
import { EventActions } from '../components/EventActions';
import { EditableDescription } from '../components/EditableDescription';
import { AudioRecorder } from '../components/AudioRecorder';
import { RecordingsList } from '../components/RecordingsList';
import type { MedicalEvent } from '../../domain/models/medical-event';
import type { EventPhoto, LinkPhotoInput } from '../../domain/models/event-photo';
import type { EventRecording } from '../../domain/models/event-recording';

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
  const [recordings, setRecordings] = useState<EventRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadPhotos = useCallback(async () => {
    const ph = await listPhotosByEvent(eventoId);
    setFotos(ph);
  }, [eventoId]);

  const reloadRecordings = useCallback(async () => {
    const recs = await listRecordingsByEvent(eventoId);
    setRecordings(recs);
  }, [eventoId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ev, ph, recs] = await Promise.all([
          getEventById(eventoId),
          listPhotosByEvent(eventoId),
          listRecordingsByEvent(eventoId),
        ]);
        setEvento(ev);
        setFotos(ph);
        setRecordings(recs);
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

  const handleRecordingComplete = async (blob: Blob, durationSeconds: number) => {
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
    const result = await uploadPhoto(eventoId, file);
    await createRecording({
      eventId: eventoId,
      recordingUrl: result.url,
      fileName: result.fileName,
      durationSeconds,
    });
    await reloadRecordings();
  };

  const handleDeleteRecording = async (id: string) => {
    await deleteRecording(id);
    await reloadRecordings();
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
            {fotos.map((foto) => {
              const url = foto.googlePhotosUrl;
              const isPdf = url.toLowerCase().endsWith('.pdf') || foto.googlePhotosId.toLowerCase().endsWith('.pdf');
              const isImage = !isPdf && url.startsWith('http') && !url.startsWith('memory://');
              const icon = isPdf ? '📄' : '📷';
              return (
                <div
                  key={foto.id}
                  className="rounded-lg border border-gray-100 overflow-hidden"
                >
                  {isImage && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={url}
                        alt={foto.description ?? foto.googlePhotosId}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    </a>
                  )}
                  <div className="flex items-center gap-2 p-2">
                    <span className="text-lg">{icon}</span>
                    <a
                      href={url}
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
                </div>
              );
            })}
          </div>
        )}
        <PhotoLinker eventId={eventoId} onPhotoLinked={handleLinkPhoto} />
      </div>

      {/* Recordings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Grabaciones ({recordings.length})
        </h3>
        <RecordingsList recordings={recordings} onDelete={handleDeleteRecording} />
        <div className="mt-3">
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      </div>
    </div>
  );
}
