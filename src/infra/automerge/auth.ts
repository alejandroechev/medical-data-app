/**
 * Client-side auth for the Automerge sync server.
 * Handles device registration, token storage, and authenticated requests.
 * Only active when VITE_STORAGE_BACKEND=automerge.
 */

const TOKEN_KEY = "medapp-sync-token";
const DEVICE_ID_KEY = "medapp-sync-device-id";

const SYNC_SERVER_HTTP = (import.meta.env.VITE_SYNC_SERVER_URL || "ws://localhost:3030")
  .replace(/^ws/, "http");

export interface AuthState {
  status: "authenticated" | "needs-registration" | "checking";
  token?: string;
  deviceId?: string;
}

/** Get stored token, or null if not registered */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID_KEY);
}

/** Check if server requires auth and if we have a valid token */
export async function checkAuthStatus(): Promise<AuthState> {
  try {
    const res = await fetch(`${SYNC_SERVER_HTTP}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { status: "needs-registration" };

    const health = await res.json();
    if (!health.authEnabled) {
      // Server has no auth — no token needed
      return { status: "authenticated" };
    }

    // Server requires auth — check if we have a valid token
    const token = getStoredToken();
    if (!token) return { status: "needs-registration" };

    // Validate token by hitting a protected endpoint
    const check = await fetch(`${SYNC_SERVER_HTTP}/auth/devices`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });

    if (check.ok) {
      return { status: "authenticated", token, deviceId: getStoredDeviceId() ?? undefined };
    }

    // Token is invalid/expired — need re-registration
    clearAuth();
    return { status: "needs-registration" };
  } catch {
    // Server unreachable — if we have a token, use it optimistically (offline)
    const token = getStoredToken();
    if (token) {
      return { status: "authenticated", token, deviceId: getStoredDeviceId() ?? undefined };
    }
    return { status: "needs-registration" };
  }
}

/** Register this device with the sync server */
export async function registerDevice(
  deviceName: string,
  registrationKey: string
): Promise<{ token: string; deviceId: string }> {
  const res = await fetch(`${SYNC_SERVER_HTTP}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceName, registrationKey }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Registration failed" }));
    throw new Error(error.error || `Registration failed (${res.status})`);
  }

  const { jwt, deviceId } = await res.json();
  localStorage.setItem(TOKEN_KEY, jwt);
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return { token: jwt, deviceId };
}

/** Clear stored auth (for re-registration or logout) */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DEVICE_ID_KEY);
}

/** Get WebSocket URL with token appended as query param */
export function getAuthenticatedWsUrl(): string {
  const baseUrl = import.meta.env.VITE_SYNC_SERVER_URL || "ws://localhost:3030";
  const token = getStoredToken();
  if (!token) return baseUrl;
  return `${baseUrl}?token=${encodeURIComponent(token)}`;
}

/** Get auth headers for blob HTTP requests */
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
