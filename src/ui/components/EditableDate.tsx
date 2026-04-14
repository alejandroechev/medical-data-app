import { useState } from 'react';
import { commonIcons } from './icons';

interface EditableDateProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
}

export function EditableDate({ value, onSave }: EditableDateProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!draft.trim()) {
      setError('La fecha es obligatoria');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
    setError(null);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-500">{value}</p>
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="text-xs text-blue-500 hover:text-blue-700"
          aria-label="Editar fecha"
        >
          <commonIcons.edit className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}
      <input
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Fecha del evento"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={handleCancel}
          className="border border-gray-300 px-4 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
