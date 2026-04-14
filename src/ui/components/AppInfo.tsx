import { useEffect, useState } from 'react';
import { getStorageBackend } from '../../infra/store-provider.js';

const DOC_URL_KEY = 'medapp-automerge-doc-url';

export function AppInfo() {
  const [docUrl, setDocUrl] = useState('');
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
      </div>
    </div>
  );
}
