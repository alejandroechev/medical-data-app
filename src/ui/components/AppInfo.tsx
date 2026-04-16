import { useEffect, useState } from 'react';
import { getStorageBackend } from '../../infra/store-provider.js';

const DOC_URL_KEY = 'medapp-automerge-doc-url';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AppInfo() {
  const [docUrl, setDocUrl] = useState('');
  const [docSize, setDocSize] = useState<string | null>(null);
  const backend = getStorageBackend();
  const usesSyncEngine = backend === 'automerge';

  useEffect(() => {
    const refresh = () => {
      setDocUrl(localStorage.getItem(DOC_URL_KEY) ?? '');
    };

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('medapp:doc-changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('medapp:doc-changed', refresh);
    };
  }, []);

  useEffect(() => {
    if (!usesSyncEngine) return;
    let cancelled = false;

    async function computeSize() {
      try {
        const { getDocHandle } = await import('../../infra/automerge/repo.js');
        const { save } = await import('@automerge/automerge');
        const handle = await getDocHandle();
        const doc = handle.doc();
        if (doc && !cancelled) {
          const binary = save(doc);
          setDocSize(formatBytes(binary.byteLength));
        }
      } catch {
        // silently skip if automerge not available
      }
    }

    computeSize();

    const onChanged = () => computeSize();
    window.addEventListener('medapp:doc-changed', onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('medapp:doc-changed', onChanged);
    };
  }, [usesSyncEngine]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-2">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900 space-y-1">
        <p><span className="font-semibold">Versión:</span> {__APP_VERSION__}</p>
        <p><span className="font-semibold">Backend:</span> {backend}</p>
        <p>
          <span className="font-semibold">Sync:</span>{' '}
          {usesSyncEngine ? (import.meta.env.VITE_SYNC_SERVER_URL || 'no configurado') : 'no aplica'}
        </p>
        <p className="break-all">
          <span className="font-semibold">Doc URL:</span>{' '}
          {usesSyncEngine ? (docUrl || 'creando...') : 'no aplica'}
        </p>
        {usesSyncEngine && docSize && (
          <p>
            <span className="font-semibold">Tamaño doc:</span> {docSize}
          </p>
        )}
      </div>
    </div>
  );
}
