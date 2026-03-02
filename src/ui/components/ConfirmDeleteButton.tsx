import { useState } from 'react';

interface ConfirmDeleteButtonProps {
  onConfirm: () => Promise<void>;
  label: string;
  confirmMessage?: string;
}

export function ConfirmDeleteButton({ onConfirm, label, confirmMessage = '¿Eliminar?' }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <span className="text-xs text-red-600">{confirmMessage}</span>
        <button
          onClick={async () => {
            setDeleting(true);
            try {
              await onConfirm();
            } finally {
              setDeleting(false);
              setConfirming(false);
            }
          }}
          disabled={deleting}
          className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? '...' : 'Sí'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 px-1 hover:text-gray-700"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
      aria-label={label}
    >
      ✕
    </button>
  );
}
