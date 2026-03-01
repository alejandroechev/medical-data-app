import { useState, useRef } from 'react';
import type { LinkPhotoInput } from '../../domain/models/event-photo';
import { uploadPhoto } from '../../infra/store-provider';

type Mode = 'closed' | 'choose' | 'manual';

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
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    setUploadProgress('Subiendo...');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Subiendo ${i + 1} de ${files.length}...`);
        const result = await uploadPhoto(eventId, file);
        await onPhotoLinked({
          eventId,
          googlePhotosUrl: result.url,
          googlePhotosId: result.fileName,
          description: result.fileName,
        });
      }
      setMode('closed');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('La URL es obligatoria');
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
        onClick={() => setMode('choose')}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        📷 Vincular foto
      </button>
    );
  }

  if (mode === 'choose') {
    return (
      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        {uploadProgress && (
          <div className="flex items-center gap-2 p-2">
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">{uploadProgress}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 text-center">¿Cómo quieres agregar la foto?</p>
        <label
          className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
        >
          <span className="text-xl">📷</span>
          <div>
            <p className="text-sm font-medium text-gray-800">Tomar foto o seleccionar</p>
            <p className="text-xs text-gray-500">Cámara o galería del dispositivo</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />
        </label>
        <button
          onClick={() => setMode('manual')}
          disabled={loading}
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
          disabled={loading}
          className="w-full py-1 text-xs text-gray-400 hover:text-gray-600"
        >
          Cancelar
        </button>
      </div>
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
          URL de la foto
        </label>
        <input
          id="photo-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
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
