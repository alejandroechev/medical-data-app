import { useState, useEffect, useRef, useCallback } from 'react';
import {
  isGoogleConfigured,
  initGoogleAuth,
  createPickerSession,
  pollPickerSession,
  listPickedMediaItems,
  getAccessToken,
} from '../../infra/google/google-photos';
import type { GooglePhotoItem } from '../../infra/google/google-photos';

interface GooglePhotoPickerProps {
  onSelect: (photo: GooglePhotoItem) => void;
  onCancel: () => void;
}

type PickerState = 'idle' | 'authenticating' | 'waiting' | 'loaded';

export function GooglePhotoPicker({ onSelect, onCancel }: GooglePhotoPickerProps) {
  const [pickedPhotos, setPickedPhotos] = useState<GooglePhotoItem[]>([]);
  const [state, setState] = useState<PickerState>(getAccessToken() ? 'idle' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleConnect = async () => {
    setState('authenticating');
    setError(null);
    try {
      await initGoogleAuth();
      const session = await createPickerSession();
      window.open(session.pickerUri, '_blank');
      setState('waiting');

      pollingRef.current = setInterval(async () => {
        try {
          const status = await pollPickerSession(session.sessionId);
          if (status.mediaItemsSet) {
            stopPolling();
            const items = await listPickedMediaItems(session.sessionId);
            setPickedPhotos(items);
            setState('loaded');
          }
        } catch (err) {
          stopPolling();
          setError((err as Error).message);
          setState('idle');
        }
      }, 3000);
    } catch (err) {
      setError((err as Error).message);
      setState('idle');
    }
  };

  if (!isGoogleConfigured()) {
    return null;
  }

  if (state === 'idle' || state === 'authenticating') {
    return (
      <div className="space-y-3 bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Conecta tu cuenta de Google para seleccionar fotos
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleConnect}
            disabled={state === 'authenticating'}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <span>🔗</span>
            {state === 'authenticating' ? 'Conectando...' : 'Conectar Google Photos'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (state === 'waiting') {
    return (
      <div className="space-y-3 bg-gray-50 rounded-lg p-4 text-center">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Google Photos</h4>
          <button
            onClick={() => { stopPolling(); onCancel(); }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ✕ Cerrar
          </button>
        </div>
        <div className="py-6">
          <p className="text-sm text-gray-600 mb-2">Esperando selección...</p>
          <p className="text-xs text-gray-400">
            Selecciona fotos en la ventana de Google Photos y ciérrala cuando termines
          </p>
          <div className="mt-3 flex justify-center">
            <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Fotos seleccionadas</h4>
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ✕ Cerrar
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      {pickedPhotos.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No se seleccionaron fotos
        </p>
      )}

      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {pickedPhotos.map((photo) => (
          <li key={photo.id}>
            <button
              onClick={() => onSelect(photo)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <img
                src={`${photo.baseUrl}=w48-h48-c`}
                alt={photo.mediaFile.filename}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <span className="text-sm text-gray-700 truncate">
                {photo.mediaFile.filename}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
