import type { PatientDrug, DrugStatus } from '../../domain/models/prescription-drug';
import { formatSchedule, formatDuration, getTreatmentProgress } from '../../domain/models/prescription-drug';
import { commonIcons } from './icons';

interface DrugCardProps {
  drug: PatientDrug;
  patientName?: string;
  onClick?: (id: string) => void;
}

const STATUS_STYLES: Record<DrugStatus, { bg: string; label: string }> = {
  active: { bg: 'bg-green-100 text-green-700', label: 'Activo' },
  completed: { bg: 'bg-gray-100 text-gray-600', label: 'Completado' },
  stopped: { bg: 'bg-red-100 text-red-700', label: 'Detenido' },
};

export function DrugCard({ drug, patientName, onClick }: DrugCardProps) {
  const statusStyle = STATUS_STYLES[drug.status];
  const progress = drug.status === 'active' ? getTreatmentProgress(drug) : null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(drug.id)}
      className="w-full text-left bg-white rounded-lg shadow-sm border border-gray-100 p-3 space-y-2 hover:shadow-md transition-shadow"
    >
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
    </button>
  );
}
