// Requires "Google Photos Picker API" enabled in Google Cloud Console
// OAuth scope: photospicker.mediaitems.readonly
// Add this scope in Google Cloud Console → APIs & Services → OAuth consent screen → Data Access

const GOOGLE_PHOTOS_SCOPE = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

export interface GooglePhotoItem {
  id: string;
  baseUrl: string;
  mimeType: string;
  mediaFile: {
    filename: string;
  };
  /** @deprecated Picker API doesn't provide productUrl; defaults to baseUrl */
  productUrl: string;
  /** Convenience alias for mediaFile.filename */
  filename: string;
}

export interface PickerSession {
  sessionId: string;
  pickerUri: string;
}

export interface PickerSessionStatus {
  mediaItemsSet: boolean;
}

export function isGoogleConfigured(): boolean {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  return Boolean(clientId && apiKey);
}

export function initGoogleAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      reject(new Error('VITE_GOOGLE_CLIENT_ID no configurado'));
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_PHOTOS_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken();
  });
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function createPickerSession(): Promise<PickerSession> {
  if (!accessToken) {
    throw new Error('No autenticado con Google. Llame a initGoogleAuth() primero.');
  }

  const response = await fetch(
    'https://photospicker.googleapis.com/v1/sessions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error al crear sesión del picker: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { sessionId: data.id, pickerUri: data.pickerUri };
}

export async function pollPickerSession(
  sessionId: string
): Promise<PickerSessionStatus> {
  if (!accessToken) {
    throw new Error('No autenticado con Google. Llame a initGoogleAuth() primero.');
  }

  const response = await fetch(
    `https://photospicker.googleapis.com/v1/sessions/${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error al consultar sesión: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { mediaItemsSet: Boolean(data.mediaItemsSet) };
}

export async function listPickedMediaItems(
  sessionId: string
): Promise<GooglePhotoItem[]> {
  if (!accessToken) {
    throw new Error('No autenticado con Google. Llame a initGoogleAuth() primero.');
  }

  const response = await fetch(
    `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${encodeURIComponent(sessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error al listar fotos seleccionadas: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data.mediaItems ?? []).map(
    (item: Record<string, unknown>) => {
      const filename = (item.mediaFile as Record<string, string>)?.filename ?? '';
      return {
        id: item.id as string,
        baseUrl: item.baseUrl as string,
        mimeType: item.mimeType as string,
        mediaFile: { filename },
        productUrl: item.baseUrl as string,
        filename,
      };
    }
  );
}

// Type declaration for Google Identity Services
declare global {
  namespace google.accounts.oauth2 {
    interface TokenClient {
      requestAccessToken(): void;
    }
    interface TokenResponse {
      access_token: string;
      error?: string;
    }
    function initTokenClient(config: {
      client_id: string;
      scope: string;
      callback: (response: TokenResponse) => void;
    }): TokenClient;
  }
}
