import { useEffect, useState, useCallback } from 'react';
import { getEventById, listPhotosByEvent, linkPhoto, unlinkPhoto, updateEvent, deleteEvent, uploadPhoto, createRecording, listRecordingsByEvent, deleteRecording, listProfessionals, createProfessional, listLocations, createLocation } from '../../infra/store-provider';
import { getFamilyMemberById } from '../../infra/supabase/family-member-store';
import { PhotoLinker } from '../components/PhotoLinker';
import { EventActions } from '../components/EventActions';
import { EditableDescription } from '../components/EditableDescription';
import { EditableDate } from '../components/EditableDate';
import { AudioRecorder } from '../components/AudioRecorder';
import { RecordingsList } from '../components/RecordingsList';
import { CreatableSelect } from '../components/CreatableSelect';
import { ConfirmDeleteButton } from '../components/ConfirmDeleteButton';
import type { MedicalEvent, ReimbursementStatus } from '../../domain/models/medical-event';
import type { EventPhoto, LinkPhotoInput } from '../../domain/models/event-photo';
import type { EventRecording } from '../../domain/models/event-recording';
import type { Professional, Location } from '../../domain/models/professional-location';

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
  'Receta': '💊',
  'Otro': '📋',
};

export function DetalleEventoPage({ eventoId, onDeleted }: DetalleEventoPageProps) {
  const [evento, setEvento] = useState<MedicalEvent | null>(null);
  const [parentEvento, setParentEvento] = useState<MedicalEvent | null>(null);
  const [fotos, setFotos] = useState<EventPhoto[]>([]);
  const [recordings, setRecordings] = useState<EventRecording[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
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
        const [ev, ph, recs, profs, locs] = await Promise.all([
          getEventById(eventoId),
          listPhotosByEvent(eventoId),
          listRecordingsByEvent(eventoId),
          listProfessionals(),
          listLocations(),
        ]);
        setEvento(ev);
        setFotos(ph);
        setRecordings(recs);
        setProfessionals(profs);
        setLocations(locs);
        if (ev?.parentEventId) {
          const parent = await getEventById(ev.parentEventId);
          setParentEvento(parent);
        }
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

  const handleToggleIsapre = async (status: ReimbursementStatus) => {
    const updated = await updateEvent(eventoId, { isapreReimbursementStatus: status });
    setEvento(updated);
  };

  const handleToggleInsurance = async (status: ReimbursementStatus) => {
    const updated = await updateEvent(eventoId, { insuranceReimbursementStatus: status });
    setEvento(updated);
  };

  const handleUpdateDescription = async (newDescription: string) => {
    const updated = await updateEvent(eventoId, { description: newDescription });
    setEvento(updated);
  };

  const handleUpdateDate = async (newDate: string) => {
    const updated = await updateEvent(eventoId, { date: newDate });
    setEvento(updated);
  };

  const handleTogglePermanent = async (value: boolean) => {
    const updated = await updateEvent(eventoId, {
      isPermanent: value,
      ...(value ? {} : { nextPickupDate: null }),
    });
    setEvento(updated);
  };

  const handleUpdateNextPickupDate = async (newDate: string) => {
    const updated = await updateEvent(eventoId, { nextPickupDate: newDate || null });
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

  const handleCheckpointSaved = async (blob: Blob, durationSeconds: number) => {
    const file = new File([blob], `checkpoint-${Date.now()}.webm`, { type: 'audio/webm' });
    const result = await uploadPhoto(eventoId, file);
    await createRecording({
      eventId: eventoId,
      recordingUrl: result.url,
      fileName: result.fileName,
      durationSeconds,
      description: `Checkpoint (${Math.floor(durationSeconds / 60)} min)`,
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
  const isReceta = evento.type === 'Receta';
  const derivedProfessionalId = isReceta && parentEvento?.professionalId ? parentEvento.professionalId : evento.professionalId;

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{evento.type}</h2>
            <EditableDate value={evento.date} onSave={handleUpdateDate} />
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

        {isReceta && parentEvento && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Evento asociado</span>
            <span className="text-sm font-medium text-blue-600">
              {parentEvento.type}: {parentEvento.description.substring(0, 30)}
            </span>
          </div>
        )}

        {isReceta ? (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Profesional</span>
            <span className="text-sm font-medium">
              {derivedProfessionalId
                ? professionals.find((p) => p.id === derivedProfessionalId)?.name ?? 'Desconocido'
                : 'Del evento asociado'}
            </span>
          </div>
        ) : (
          <CreatableSelect
            label="Profesional"
            id="detail-profesional"
            value={evento.professionalId ?? ''}
            options={professionals.map((p) => ({ id: p.id, label: p.specialty ? `${p.name} (${p.specialty})` : p.name }))}
            onChange={async (id) => {
              const updated = await updateEvent(eventoId, { professionalId: id || null });
              setEvento(updated);
            }}
            onCreate={async (name) => {
              const p = await createProfessional(name);
              setProfessionals((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)));
              const updated = await updateEvent(eventoId, { professionalId: p.id });
              setEvento(updated);
              return p.id;
            }}
            placeholder="Sin profesional"
          />
        )}

        <CreatableSelect
          label="Lugar"
          id="detail-lugar"
          value={evento.locationId ?? ''}
          options={locations.map((l) => ({ id: l.id, label: l.name }))}
          onChange={async (id) => {
            const updated = await updateEvent(eventoId, { locationId: id || null });
            setEvento(updated);
          }}
          onCreate={async (name) => {
            const l = await createLocation(name);
            setLocations((prev) => [...prev, l].sort((a, b) => a.name.localeCompare(b.name)));
            const updated = await updateEvent(eventoId, { locationId: l.id });
            setEvento(updated);
            return l.id;
          }}
          placeholder="Sin lugar"
        />
      </div>

      {/* Receta: Permanente & Next Pickup */}
      {isReceta && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Receta</h3>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Receta permanente</span>
            <input
              type="checkbox"
              checked={evento.isPermanent ?? false}
              onChange={(e) => handleTogglePermanent(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
              aria-label="Receta permanente"
            />
          </label>

          {evento.isPermanent && (
            <div>
              <label htmlFor="next-pickup" className="block text-xs text-gray-500 mb-1">
                Próximo retiro
              </label>
              <input
                id="next-pickup"
                type="date"
                value={evento.nextPickupDate ?? ''}
                onChange={(e) => handleUpdateNextPickupDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      )}

      {/* Reembolsos & Delete */}
      <EventActions
        isapreReimbursementStatus={evento.isapreReimbursementStatus}
        insuranceReimbursementStatus={evento.insuranceReimbursementStatus}
        onDelete={handleDelete}
        onChangeIsapreStatus={handleToggleIsapre}
        onChangeInsuranceStatus={handleToggleInsurance}
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
                    <ConfirmDeleteButton
                      onConfirm={() => handleUnlinkPhoto(foto.id)}
                      label={`Desvincular ${foto.description ?? foto.googlePhotosId}`}
                    />
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
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onCheckpointSaved={handleCheckpointSaved}
          />
        </div>
      </div>
    </div>
  );
}
