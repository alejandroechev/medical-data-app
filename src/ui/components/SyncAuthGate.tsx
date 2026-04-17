import { useState, useEffect } from "react";
import { checkAuthStatus, registerDevice, getStoredToken } from "../../infra/automerge/auth.js";
import { getStorageBackend } from "../../infra/store-provider.js";
import { commonIcons } from "./icons";

interface SyncAuthGateProps {
  children: React.ReactNode;
}

/**
 * Gate component that requires device registration before showing the app.
 * Only active when VITE_STORAGE_BACKEND=automerge and the sync server requires auth.
 * Passes through immediately for supabase/memory backends.
 * Uses optimistic auth: reads token from localStorage synchronously and renders
 * immediately. Background-validates the token after the app is already showing.
 */
export function SyncAuthGate({ children }: SyncAuthGateProps) {
  const backend = getStorageBackend();
  const skipAuth = import.meta.env.VITE_DISABLE_SYNC_AUTH === "1" || backend !== "automerge";
  const hasToken = !skipAuth && !!getStoredToken();

  // Optimistic: if we have a token or auth is skipped, render immediately
  const [status, setStatus] = useState<"authenticated" | "needs-registration">(
    skipAuth || hasToken ? "authenticated" : "needs-registration"
  );
  const [deviceName, setDeviceName] = useState("");
  const [registrationKey, setRegistrationKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Background-validate the token (if invalid, switch to registration)
  useEffect(() => {
    if (skipAuth || !hasToken) return;

    checkAuthStatus()
      .then((result) => {
        if (result.status === "needs-registration") {
          setStatus("needs-registration");
        }
      })
      .catch(() => {
        // Network error — stay authenticated optimistically (local-first)
      });
  }, [skipAuth, hasToken]);

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
          <commonIcons.lock className="h-9 w-9 mx-auto mb-2 text-blue-600" aria-hidden="true" />
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
