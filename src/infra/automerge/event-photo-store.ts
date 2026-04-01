import { v4 as uuidv4 } from "uuid";
import { getDocHandle, waitForDoc } from "./repo.js";
import type { EventPhoto, LinkPhotoInput } from "../../domain/models/event-photo.js";
import type { UploadResult } from "../../domain/services/photo-uploader.js";
import { storeAndSyncBlob } from "./blob-sync.js";

// --- Event Photo Store ---

export async function linkPhoto(input: LinkPhotoInput): Promise<EventPhoto> {
  const handle = await getDocHandle();
  const id = uuidv4();
  const now = new Date().toISOString();

  const photo: EventPhoto = {
    id,
    eventId: input.eventId,
    googlePhotosUrl: input.googlePhotosUrl,
    googlePhotosId: input.googlePhotosId,
    description: input.description,
    createdAt: now,
  };

  handle.change((d) => {
    if (!d.eventPhotos) d.eventPhotos = {};
    d.eventPhotos[id] = photo;
  });

  return { ...photo };
}

export async function listPhotosByEvent(eventId: string): Promise<EventPhoto[]> {
  const doc = await waitForDoc();
  return Object.values(doc.eventPhotos || {})
    .filter((p) => p.eventId === eventId)
    .map((p) => ({ ...p }));
}

export async function unlinkPhoto(id: string): Promise<void> {
  const handle = await getDocHandle();
  handle.change((d) => {
    delete d.eventPhotos[id];
  });
}

// --- Photo Storage (local-first with blob sync) ---

export async function uploadPhoto(_eventId: string, file: File): Promise<UploadResult> {
  const { blobId, localUrl } = await storeAndSyncBlob(file);
  return { url: localUrl, fileName: `blob:${blobId}` };
}

export async function deletePhoto(_url: string): Promise<void> {
  // Blob GC handled server-side (Phase 5)
}
