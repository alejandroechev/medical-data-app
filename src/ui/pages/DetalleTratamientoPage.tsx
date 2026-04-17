import { useState, useEffect, useCallback } from 'react';
import { listAllPatientDrugs, updatePatientDrug } from '../../infra/store-provider';
import { getFamilyMemberById } from '../../infra/supabase/family-member-store';
import { DrugForm } from '../components/DrugForm';
import { commonIcons } from '../components/icons';
import type { PatientDrug, UpdatePatientDrugInput } from '../../domain/models/prescription-drug';
import { formatSchedule, formatDuration, getTreatmentProgress } from '../../domain/models/prescription-drug';

interface DetalleTratamientoPageProps {
  drugId: string;
}

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  active: { bg: 'bg-green-100 text-green-700', label: 'Activo' },
  completed: { bg: 'bg-gray-100 text-gray-600', label: 'Completado' },
  stopped: { bg: 'bg-red-100 text-red-700', label: 'Detenido' },
};

export function DetalleTratamientoPage({ drugId }: DetalleTratamientoPageProps) {
  const [drug, setDrug] = useState<PatientDrug | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDrug = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listAllPatientDrugs();
      const d = all.find((drug) => drug.id === drugId) ?? null;
      setDrug(d);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [drugId]);

  useEffect(() => {
    void loadDrug();
  }, [loadDrug]);

  const handleEdit = async (input: UpdatePatientDrugInput) => {
    await updatePatientDrug(drugId, input);
    setEditing(false);
    await loadDrug();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (error || !drug) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error ?? 'Tratamiento no encontrado'}</p>
        </div>
      </div>
    );
  }

  const paciente = getFamilyMemberById(drug.patientId);
  const statusStyle = STATUS_STYLES[drug.status] ?? STATUS_STYLES.active;
  const progress = drug.status === 'active' ? getTreatmentProgress(drug) : null;

  if (editing) {
    return (
      <div className="p-4 pb-20">
        <DrugForm
          patientId={drug.patientId}
          eventId={drug.eventId}
          initialValues={drug}
          onSubmit={async (input) => {
            await handleEdit({
              name: input.name,
              dosage: input.dosage,
              schedule: input.schedule,
              duration: input.duration,
              startDate: input.startDate,
              startTime: input.startTime ?? null,
              isPermanent: input.isPermanent,
              nextPickupDate: input.nextPickupDate ?? null,
            });
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-2">
          <commonIcons.treatments className="h-8 w-8 text-blue-500" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">{drug.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle.bg}`}>
              {statusStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Paciente</span>
          <span className="text-sm font-medium">{paciente?.name ?? 'Desconocido'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Dosis</span>
          <span className="text-sm font-medium">{drug.dosage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Horario</span>
          <span className="text-sm font-medium">{formatSchedule(drug.schedule)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Duración</span>
          <span className="text-sm font-medium">{formatDuration(drug.duration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Inicio</span>
          <span className="text-sm font-medium">
            {drug.startDate}{drug.startTime ? ` ${drug.startTime}` : ''}
          </span>
        </div>
        {drug.endDate && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Fin</span>
            <span className="text-sm font-medium">{drug.endDate}</span>
          </div>
        )}
        {drug.isPermanent && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Tipo</span>
            <span className="text-sm font-medium text-indigo-600">Permanente</span>
          </div>
        )}
        {drug.isPermanent && drug.nextPickupDate && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Próximo retiro</span>
            <span className="text-sm font-medium text-indigo-600">{drug.nextPickupDate}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      {progress && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Día {progress.currentDay} de {progress.totalDays}</span>
            <span>{Math.round((progress.currentDay / progress.totalDays) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (progress.currentDay / progress.totalDays) * 100)}%` }}
            />
          </div>
          {progress.dosesRemaining > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {progress.dosesRemaining} dosis restante{progress.dosesRemaining !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Edit button */}
      <button
        onClick={() => setEditing(true)}
        className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5">
          <commonIcons.edit className="h-4 w-4" aria-hidden="true" />
          Editar tratamiento
        </span>
      </button>
    </div>
  );
}
