import { useState, useEffect } from "react";
import { checkAuthStatus, registerDevice } from "../../infra/automerge/auth.js";
import { getStorageBackend } from "../../infra/store-provider.js";

interface SyncAuthGateProps {
  children: React.ReactNode;
}

/**
 * Gate component that requires device registration before showing the app.
 * Only active when VITE_STORAGE_BACKEND=automerge and the sync server requires auth.
 * Passes through immediately for supabase/memory backends.
 */
export function SyncAuthGate({ children }: SyncAuthGateProps) {
  const [status, setStatus] = useState<"checking" | "authenticated" | "needs-registration">("checking");
  const [deviceName, setDeviceName] = useState("");
  const [registrationKey, setRegistrationKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getStorageBackend() !== "automerge") {
      setStatus("authenticated");
      return;
    }

    checkAuthStatus()
      .then((result) => setStatus(result.status))
      .catch(() => setStatus("needs-registration"));
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🔄</div>
          <p>Conectando con el servidor de sincronización...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return <>{children}</>;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await registerDevice(deviceName.trim(), registrationKey);
      setStatus("authenticated");
      // Reload to reinitialize the Automerge repo with the new token
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar dispositivo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔐</div>
          <h2 className="text-xl font-bold text-gray-800">Registrar Dispositivo</h2>
          <p className="text-sm text-gray-500 mt-1">
            Este dispositivo necesita registrarse para sincronizar datos.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del dispositivo
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Ej: iPhone de Alejandro"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clave de registro
            </label>
            <input
              type="password"
              value={registrationKey}
              onChange={(e) => setRegistrationKey(e.target.value)}
              placeholder="Ingresa la clave del servidor"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !deviceName.trim() || !registrationKey}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Registrando..." : "Registrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
