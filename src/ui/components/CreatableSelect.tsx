import { useState } from 'react';

interface CreatableSelectProps {
  label: string;
  id: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  onCreate: (name: string) => Promise<string>; // returns new ID
  placeholder?: string;
}

export function CreatableSelect({
  label,
  id,
  value,
  options,
  onChange,
  onCreate,
  placeholder = 'Seleccionar...',
}: CreatableSelectProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const newId = await onCreate(newName.trim());
      onChange(newId);
      setNewName('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Nuevo ${label.toLowerCase()}...`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '...' : '✓'}
          </button>
          <button
            onClick={() => { setAdding(false); setNewName(''); }}
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => setAdding(true)}
          className="border border-gray-300 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          title={`Agregar ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
