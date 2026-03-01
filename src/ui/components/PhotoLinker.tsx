import { useState } from 'react';
import type { LinkPhotoInput } from '../../domain/models/event-photo';
import { isGoogleConfigured } from '../../infra/google/google-photos';
import type { GooglePhotoItem } from '../../infra/google/google-photos';
import { GooglePhotoPicker } from './GooglePhotoPicker';

type Mode = 'closed' | 'choose' | 'google' | 'manual';

interface PhotoLinkerProps {
  eventId: string;
  onPhotoLinked: (input: LinkPhotoInput) => Promise<void>;
}

export function PhotoLinker({ eventId, onPhotoLinked }: PhotoLinkerProps) {
  const [mode, setMode] = useState<Mode>('closed');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleAvailable = isGoogleConfigured();

  const handleGoogleSelect = async (photo: GooglePhotoItem) => {
    setLoading(true);
    setError(null);
    try {
      await onPhotoLinked({
        eventId,
        googlePhotosUrl: photo.productUrl,
        googlePhotosId: photo.id,
        description: photo.filename,
      });
      setMode('closed');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('La URL de Google Photos es obligatoria');
      return;
    }

    const photoId = url.split('/').pop() || url;

    setLoading(true);
    try {
      await onPhotoLinked({
        eventId,
        googlePhotosUrl: url,
        googlePhotosId: photoId,
        description: description || undefined,
      });
      setUrl('');
      setDescription('');
      setMode('closed');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'closed') {
    return (
      <button
        onClick={() => setMode(googleAvailable ? 'choose' : 'manual')}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        📷 Vincular foto
      </button>
    );
  }

  // Mode selector: Google Photos or manual URL
  if (mode === 'choose') {
    return (
      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 text-center">¿Cómo quieres agregar la foto?</p>
        <button
          onClick={() => setMode('google')}
          className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors text-left"
        >
          <span className="text-xl">🔍</span>
          <div>
            <p className="text-sm font-medium text-gray-800">Buscar en Google Photos</p>
            <p className="text-xs text-gray-500">Selecciona de tu biblioteca</p>
          </div>
        </button>
        <button
          onClick={() => setMode('manual')}
          className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors text-left"
        >
          <span className="text-xl">🔗</span>
          <div>
            <p className="text-sm font-medium text-gray-800">Pegar URL</p>
            <p className="text-xs text-gray-500">Ingresa un enlace manualmente</p>
          </div>
        </button>
        <button
          onClick={() => setMode('closed')}
          className="w-full py-1 text-xs text-gray-400 hover:text-gray-600"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // Google Photos picker
  if (mode === 'google') {
    return (
      <GooglePhotoPicker
        onSelect={handleGoogleSelect}
        onCancel={() => setMode('closed')}
      />
    );
  }

  // Manual URL form
  return (
    <form onSubmit={handleManualSubmit} className="space-y-3 bg-gray-50 rounded-lg p-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      <div>
        <label htmlFor="photo-url" className="block text-xs text-gray-500 mb-1">
          URL de Google Photos
        </label>
        <input
          id="photo-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://photos.google.com/photo/..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="photo-desc" className="block text-xs text-gray-500 mb-1">
          Descripción (opcional)
        </label>
        <input
          id="photo-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Receta, boleta, epicrisis..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => { setMode('closed'); setError(null); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
