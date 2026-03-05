import { useState } from 'react';
import type { ReimbursementStatus } from '../../domain/models/medical-event';
import { REEMBOLSO_LINKS } from '../../domain/models/medical-event';

interface EventActionsProps {
  isapreReimbursementStatus: ReimbursementStatus;
  insuranceReimbursementStatus: ReimbursementStatus;
  onDelete: () => Promise<void>;
  onChangeIsapreStatus: (status: ReimbursementStatus) => Promise<void>;
  onChangeInsuranceStatus: (status: ReimbursementStatus) => Promise<void>;
}

const STATUS_LABELS: Record<ReimbursementStatus, string> = {
  none: 'Sin solicitar',
  requested: 'Solicitado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const STATUS_COLORS: Record<ReimbursementStatus, string> = {
  none: 'bg-gray-100 text-gray-600',
  requested: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function ReimbursementStatusControl({
  label,
  status,
  onChange,
  portalUrl,
}: {
  label: string;
  status: ReimbursementStatus;
  onChange: (status: ReimbursementStatus) => Promise<void>;
  portalUrl: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {(['none', 'requested', 'approved', 'rejected'] as ReimbursementStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            disabled={s === status}
            aria-label={`${label} ${STATUS_LABELS[s]}`}
            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
              s === status
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium cursor-default'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <a
        href={portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
        aria-label={`Portal ${label}`}
      >
        🔗 Ir al portal
      </a>
    </div>
  );
}

export function EventActions({
  isapreReimbursementStatus,
  insuranceReimbursementStatus,
  onDelete,
  onChangeIsapreStatus,
  onChangeInsuranceStatus,
}: EventActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Reembolsos</h3>

      <ReimbursementStatusControl
        label="ISAPRE"
        status={isapreReimbursementStatus}
        onChange={onChangeIsapreStatus}
        portalUrl={REEMBOLSO_LINKS.isapre}
      />

      <hr className="border-gray-100" />

      <ReimbursementStatusControl
        label="Seguro Complementario"
        status={insuranceReimbursementStatus}
        onChange={onChangeInsuranceStatus}
        portalUrl={REEMBOLSO_LINKS.insurance}
      />

      <hr className="border-gray-100" />

      {showConfirm ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-red-700">¿Estás seguro de eliminar este evento?</p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 border border-gray-300 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
        >
          🗑 Eliminar evento
        </button>
      )}
    </div>
  );
}
