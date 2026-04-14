import { useEffect, useState, useCallback } from 'react';
import { getEventById, listPhotosByEvent, linkPhoto, unlinkPhoto, updateEvent, archiveEvent, unarchiveEvent, uploadPhoto, createRecording, listRecordingsByEvent, deleteRecording, listProfessionals, createProfessional, listLocations, createLocation, createPatientDrug, listPatientDrugsByEvent, updatePatientDrug, deletePatientDrug, createEvent } from '../../infra/store-provider';
import { getFamilyMemberById } from '../../infra/supabase/family-member-store';
import { PhotoLinker } from '../components/PhotoLinker';
import { EventActions, ArchiveAction } from '../components/EventActions';
import { EditableDescription } from '../components/EditableDescription';
import { EditableDate } from '../components/EditableDate';
import { AudioRecorder } from '../components/AudioRecorder';
import { RecordingsList } from '../components/RecordingsList';
import { CreatableSelect } from '../components/CreatableSelect';
import { ConfirmDeleteButton } from '../components/ConfirmDeleteButton';
import { ClickableImage } from '../components/ImageModal';
import { DrugCard } from '../components/DrugCard';
import { DrugForm } from '../components/DrugForm';
import { commonIcons, eventTypeIcons } from '../components/icons';
import type { MedicalEvent, ReimbursementStatus } from '../../domain/models/medical-event';
import type { EventPhoto, LinkPhotoInput } from '../../domain/models/event-photo';
import type { EventRecording } from '../../domain/models/event-recording';
import type { PatientDrug, CreatePatientDrugInput, UpdatePatientDrugInput } from '../../domain/models/prescription-drug';
import type { Professional, Location } from '../../domain/models/professional-location';

interface DetalleEventoPageProps {
  eventoId: string;
  onDeleted?: () => void;
  onDuplicated?: (newId: string) => void;
}

export function DetalleEventoPage({ eventoId, onDeleted, onDuplicated }: DetalleEventoPageProps) {
  const [evento, setEvento] = useState<MedicalEvent | null>(null);
  const [parentEvento, setParentEvento] = useState<MedicalEvent | null>(null);
  const [fotos, setFotos] = useState<EventPhoto[]>([]);
  const [recordings, setRecordings] = useState<EventRecording[]>([]);
  const [drugs, setDrugs] = useState<PatientDrug[]>([]);
  const [showDrugForm, setShowDrugForm] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState(false);
  const [costInput, setCostInput] = useState('');

  const reloadPhotos = useCallback(async () => {
    const ph = await listPhotosByEvent(eventoId);
    setFotos(ph);
  }, [eventoId]);

  const reloadRecordings = useCallback(async () => {
    const recs = await listRecordingsByEvent(eventoId);
    setRecordings(recs);
  }, [eventoId]);

  const reloadDrugs = useCallback(async () => {
    const d = await listPatientDrugsByEvent(eventoId);
    setDrugs(d);
  }, [eventoId]);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ev, ph, recs, d, profs, locs] = await Promise.all([
        getEventById(eventoId),
        listPhotosByEvent(eventoId),
        listRecordingsByEvent(eventoId),
        listPatientDrugsByEvent(eventoId),
        listProfessionals(),
        listLocations(),
      ]);
      setEvento(ev);
      setFotos(ph);
      setRecordings(recs);
      setDrugs(d);
      setProfessionals(profs);
      setLocations(locs);
      if (ev?.parentEventId) {
        const parent = await getEventById(ev.parentEventId);
        setParentEvento(parent);
      } else {
        setParentEvento(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const handleLinkPhoto = async (input: LinkPhotoInput) => {
    await linkPhoto(input);
    await reloadPhotos();
  };

  const handleUnlinkPhoto = async (photoId: string) => {
    await unlinkPhoto(photoId);
    await reloadPhotos();
  };

  const handleArchive = async () => {
    await archiveEvent(eventoId);
    onDeleted?.();
  };

  const handleUnarchive = async () => {
    await unarchiveEvent(eventoId);
    await loadPageData();
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

  const handleUpdateCost = async (newCost: number | null) => {
    const updated = await updateEvent(eventoId, { cost: newCost });
    setEvento(updated);
    setEditingCost(false);
  };

  const handleDuplicate = async () => {
    if (!evento) return;
    const today = new Date().toISOString().split('T')[0];
    const newEvent = await createEvent({
      date: today,
      type: evento.type,
      description: evento.description,
      patientId: evento.patientId,
      professionalId: evento.professionalId,
      locationId: evento.locationId,
      cost: evento.cost,
    });
    onDuplicated?.(newEvent.id);
  };

  const handleRecordingComplete= async (blob: Blob, durationSeconds: number) => {
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

  const handleAddDrug = async (input: CreatePatientDrugInput) => {
    await createPatientDrug(input);
    setShowDrugForm(false);
    await reloadDrugs();
  };

  const handleEditDrug = async (id: string, input: UpdatePatientDrugInput) => {
    await updatePatientDrug(id, input);
    await reloadDrugs();
  };

  const handleStopDrug = async (id: string) => {
    await updatePatientDrug(id, { status: 'stopped', endDate: new Date().toISOString().split('T')[0] });
    await reloadDrugs();
  };

  const handleDeleteDrug = async (id: string) => {
    await deletePatientDrug(id);
    await reloadDrugs();
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
  const EventIcon = eventTypeIcons[evento.type] ?? commonIcons.clipboard;
  const isReceta = evento.type === 'Receta';
  const hasParent = isReceta && !!parentEvento;
  const derivedProfessionalId = hasParent && parentEvento?.professionalId ? parentEvento.professionalId : evento.professionalId;

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <EventIcon className="h-8 w-8 text-blue-500" aria-hidden="true" />
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

        {hasParent ? (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Profesional</span>
            <span className="text-sm font-medium">
              {derivedProfessionalId
                ? professionals.find((p) => p.id === derivedProfessionalId)?.name ?? 'Desconocido'
                : 'Sin profesional'}
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

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Costo</span>
          {editingCost ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                min="0"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
                aria-label="Editar costo"
              />
              <button
                onClick={() => handleUpdateCost(costInput ? parseInt(costInput) : null)}
                className="text-xs text-blue-600 font-medium"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingCost(false)}
                className="text-xs text-gray-400"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setCostInput(evento.cost != null ? String(evento.cost) : '');
                setEditingCost(true);
              }}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {evento.cost != null && evento.cost > 0
                ? `$${evento.cost.toLocaleString('es-CL')}`
                : 'Sin costo'}
            </button>
          )}
        </div>
      </div>

      {/* Treatments (any event type) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <commonIcons.treatments className="h-4 w-4" aria-hidden="true" />
            Tratamientos ({drugs.length})
          </span>
        </h3>

        {drugs.length === 0 && !showDrugForm && (
          <p className="text-sm text-gray-400 text-center py-2">
            Sin tratamientos vinculados
          </p>
        )}

        {drugs.length > 0 && (
          <div className="space-y-2 mb-3">
            {drugs.map((drug) => (
              <DrugCard
                key={drug.id}
                drug={drug}
                onEdit={handleEditDrug}
                onStop={handleStopDrug}
                onDelete={handleDeleteDrug}
              />
            ))}
          </div>
        )}

        {showDrugForm ? (
          <DrugForm
            patientId={evento.patientId}
            eventId={eventoId}
            onSubmit={handleAddDrug}
            onCancel={() => setShowDrugForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowDrugForm(true)}
            className="w-full py-2 border border-blue-200 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5">
              <commonIcons.plus className="h-4 w-4" aria-hidden="true" />
              Agregar tratamiento
            </span>
          </button>
        )}
      </div>

      {/* Reembolsos */}
      <EventActions
        isapreReimbursementStatus={evento.isapreReimbursementStatus}
        insuranceReimbursementStatus={evento.insuranceReimbursementStatus}
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
              const DocumentKindIcon = isPdf ? commonIcons.document : commonIcons.photo;
              return (
                <div
                  key={foto.id}
                  className="rounded-lg border border-gray-100 overflow-hidden"
                >
                  {isImage && (
                    <ClickableImage
                      src={url}
                      alt={foto.description ?? foto.googlePhotosId}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="flex items-center gap-2 p-2">
                    <DocumentKindIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
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

      {/* Actions: Copy & Archive */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Acciones</h3>
        <button
          onClick={handleDuplicate}
          className="w-full py-2 border border-blue-200 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
        >
          <span className="inline-flex items-center gap-1.5">
            <commonIcons.copy className="h-4 w-4" aria-hidden="true" />
            Copiar evento
          </span>
        </button>
        <ArchiveAction
          isArchived={evento.isArchived === true}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
        />
      </div>
    </div>
  );
}
