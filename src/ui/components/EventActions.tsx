import { useState } from 'react';

interface EventActionsProps {
  isapreReimbursed: boolean;
  insuranceReimbursed: boolean;
  onDelete: () => Promise<void>;
  onToggleIsapre: (value: boolean) => Promise<void>;
  onToggleInsurance: (value: boolean) => Promise<void>;
}

export function EventActions({
  isapreReimbursed,
  insuranceReimbursed,
  onDelete,
  onToggleIsapre,
  onToggleInsurance,
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

      <label className="flex items-center justify-between">
        <span className="text-sm text-gray-600">ISAPRE</span>
        <input
          type="checkbox"
          checked={isapreReimbursed}
          onChange={(e) => onToggleIsapre(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
          aria-label="ISAPRE"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Seguro Complementario</span>
        <input
          type="checkbox"
          checked={insuranceReimbursed}
          onChange={(e) => onToggleInsurance(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
          aria-label="Seguro Complementario"
        />
      </label>

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
