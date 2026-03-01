import { useState, useEffect } from 'react';
import {
  isGoogleConfigured,
  initGoogleAuth,
  listGooglePhotos,
  getAccessToken,
} from '../../infra/google/google-photos';
import type { GooglePhotoItem } from '../../infra/google/google-photos';

interface GooglePhotoPickerProps {
  onSelect: (photo: GooglePhotoItem) => void;
  onCancel: () => void;
}

export function GooglePhotoPicker({ onSelect, onCancel }: GooglePhotoPickerProps) {
  const [photos, setPhotos] = useState<GooglePhotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(!!getAccessToken());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await initGoogleAuth();
      setAuthenticated(true);
      await loadPhotos();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (pageToken?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listGooglePhotos(pageToken, 20);
      if (pageToken) {
        setPhotos((prev) => [...prev, ...result.items]);
      } else {
        setPhotos(result.items);
      }
      setNextPageToken(result.nextPageToken);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadPhotos();
    }
  }, [authenticated]);

  if (!isGoogleConfigured()) {
    return null;
  }

  if (!authenticated) {
    return (
      <div className="space-y-3 bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Conecta tu cuenta de Google para seleccionar fotos de tu biblioteca
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleAuth}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <span>🔗</span>
            {loading ? 'Conectando...' : 'Conectar Google Photos'}
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

  return (
    <div className="space-y-3 bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Google Photos</h4>
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

      {photos.length === 0 && !loading && (
        <p className="text-sm text-gray-400 text-center py-4">
          No se encontraron fotos
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => onSelect(photo)}
            className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <img
              src={`${photo.baseUrl}=w200-h200-c`}
              alt={photo.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-gray-500 text-center py-2">Cargando fotos...</p>
      )}

      {nextPageToken && !loading && (
        <button
          onClick={() => loadPhotos(nextPageToken)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Cargar más fotos
        </button>
      )}
    </div>
  );
}
