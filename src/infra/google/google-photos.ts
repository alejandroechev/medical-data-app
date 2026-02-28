// Google Photos API integration
// Uses Google Picker API to browse and select photos from user's library

const GOOGLE_PHOTOS_SCOPE = 'https://www.googleapis.com/auth/photoslibrary.readonly';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

export interface GooglePhotoItem {
  id: string;
  baseUrl: string;
  productUrl: string;
  filename: string;
  mimeType: string;
  description?: string;
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

export async function listGooglePhotos(
  pageToken?: string,
  pageSize = 25
): Promise<{ items: GooglePhotoItem[]; nextPageToken?: string }> {
  if (!accessToken) {
    throw new Error('No autenticado con Google. Llame a initGoogleAuth() primero.');
  }

  const body: Record<string, unknown> = { pageSize };
  if (pageToken) body.pageToken = pageToken;

  const response = await fetch(
    'https://photoslibrary.googleapis.com/v1/mediaItems:search',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Error al listar fotos: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const items: GooglePhotoItem[] = (data.mediaItems ?? []).map(
    (item: Record<string, string>) => ({
      id: item.id,
      baseUrl: item.baseUrl,
      productUrl: item.productUrl,
      filename: item.filename,
      mimeType: item.mimeType,
      description: item.description,
    })
  );

  return { items, nextPageToken: data.nextPageToken };
}

export async function getGooglePhoto(mediaItemId: string): Promise<GooglePhotoItem> {
  if (!accessToken) {
    throw new Error('No autenticado con Google. Llame a initGoogleAuth() primero.');
  }

  const response = await fetch(
    `https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItemId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error al obtener foto: ${response.status} ${response.statusText}`);
  }

  const item = await response.json();
  return {
    id: item.id,
    baseUrl: item.baseUrl,
    productUrl: item.productUrl,
    filename: item.filename,
    mimeType: item.mimeType,
    description: item.description,
  };
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
