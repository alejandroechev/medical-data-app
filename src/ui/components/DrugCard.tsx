import type { PatientDrug, DrugStatus } from '../../domain/models/prescription-drug';
import { formatSchedule, formatDuration } from '../../domain/models/prescription-drug';

interface DrugCardProps {
  drug: PatientDrug;
  patientName?: string;
  onStop?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const STATUS_STYLES: Record<DrugStatus, { bg: string; label: string }> = {
  active: { bg: 'bg-green-100 text-green-700', label: 'Activo' },
  completed: { bg: 'bg-gray-100 text-gray-600', label: 'Completado' },
  stopped: { bg: 'bg-red-100 text-red-700', label: 'Detenido' },
};

function getTreatmentProgress(drug: PatientDrug): { current: number; total: number } | null {
  if (drug.duration.type !== 'days') return null;
  const start = new Date(drug.startDate + 'T00:00:00');
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return { current: Math.min(elapsed, drug.duration.days), total: drug.duration.days };
}

export function DrugCard({ drug, patientName, onStop, onDelete }: DrugCardProps) {
  const statusStyle = STATUS_STYLES[drug.status];
  const progress = drug.status === 'active' ? getTreatmentProgress(drug) : null;

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
          {patientName && (
            <p className="text-xs text-gray-400 mt-0.5">{patientName}</p>
          )}
        </div>
      </div>

      {/* Progress bar for day-count treatments */}
      {progress && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Día {progress.current} de {progress.total}</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Permanent pickup info */}
      {drug.isPermanent && drug.nextPickupDate && (
        <p className="text-xs text-indigo-600">
          📅 Próximo retiro: {drug.nextPickupDate}
        </p>
      )}

      {/* Actions */}
      {drug.status === 'active' && (onStop || onDelete) && (
        <div className="flex gap-2 pt-1">
          {onStop && (
            <button
              onClick={() => onStop(drug.id)}
              className="text-xs text-orange-600 hover:text-orange-800 border border-orange-200 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
            >
              ⏸ Detener
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(drug.id)}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              🗑 Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
