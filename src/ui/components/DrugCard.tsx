import { useState } from 'react';
import type { PatientDrug, DrugStatus, UpdatePatientDrugInput } from '../../domain/models/prescription-drug';
import { formatSchedule, formatDuration, getTreatmentProgress } from '../../domain/models/prescription-drug';
import { DrugForm } from './DrugForm';
import { commonIcons } from './icons';

interface DrugCardProps {
  drug: PatientDrug;
  patientName?: string;
  onEdit?: (id: string, input: UpdatePatientDrugInput) => Promise<void>;
  onStop?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const STATUS_STYLES: Record<DrugStatus, { bg: string; label: string }> = {
  active: { bg: 'bg-green-100 text-green-700', label: 'Activo' },
  completed: { bg: 'bg-gray-100 text-gray-600', label: 'Completado' },
  stopped: { bg: 'bg-red-100 text-red-700', label: 'Detenido' },
};

export function DrugCard({ drug, patientName, onEdit, onStop, onDelete }: DrugCardProps) {
  const [editing, setEditing] = useState(false);
  const statusStyle = STATUS_STYLES[drug.status];
  const progress = drug.status === 'active' ? getTreatmentProgress(drug) : null;

  if (editing && onEdit) {
    return (
      <DrugForm
        patientId={drug.patientId}
        eventId={drug.eventId}
        initialValues={drug}
        onSubmit={async (input) => {
          await onEdit(drug.id, {
            name: input.name,
            dosage: input.dosage,
            schedule: input.schedule,
            duration: input.duration,
            startDate: input.startDate,
            startTime: input.startTime ?? null,
            isPermanent: input.isPermanent,
            nextPickupDate: input.nextPickupDate ?? null,
          });
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{drug.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle.bg}`}>
              {statusStyle.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {drug.dosage} — {formatSchedule(drug.schedule)} — {formatDuration(drug.duration)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Inicio: {drug.startDate}{drug.startTime ? ` ${drug.startTime}` : ''}
          </p>
          {patientName && (
            <p className="text-xs text-gray-400 mt-0.5">{patientName}</p>
          )}
        </div>
      </div>

      {/* Progress bar for day-count treatments */}
      {progress && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Día {progress.currentDay} de {progress.totalDays}</span>
            <span>{Math.round((progress.currentDay / progress.totalDays) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (progress.currentDay / progress.totalDays) * 100)}%` }}
            />
          </div>
          {progress.dosesRemaining > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {progress.dosesRemaining} dosis restante{progress.dosesRemaining !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Permanent pickup info */}
      {drug.isPermanent && drug.nextPickupDate && (
        <p className="inline-flex items-center gap-1 text-xs text-indigo-600">
          <commonIcons.calendar className="h-4 w-4" aria-hidden="true" />
          Próximo retiro: {drug.nextPickupDate}
        </p>
      )}

      {/* Actions — available for all statuses */}
      <div className="flex gap-2 pt-1">
        {onEdit && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="inline-flex items-center gap-1">
              <commonIcons.edit className="h-3.5 w-3.5" aria-hidden="true" />
              Editar
            </span>
          </button>
        )}
        {drug.status === 'active' && onStop && (
          <button
            onClick={() => onStop(drug.id)}
            className="text-xs text-orange-600 hover:text-orange-800 border border-orange-200 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <span className="inline-flex items-center gap-1">
              <commonIcons.stopAction className="h-3.5 w-3.5" aria-hidden="true" />
              Detener
            </span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(drug.id)}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <span className="inline-flex items-center gap-1">
              <commonIcons.trash className="h-3.5 w-3.5" aria-hidden="true" />
              Eliminar
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
