import { v4 as uuidv4 } from "uuid";
import { getDocHandle, waitForDoc } from "./repo.js";
import type { EventPhoto, LinkPhotoInput } from "../../domain/models/event-photo.js";
import type { UploadResult } from "../../domain/services/photo-uploader.js";

// --- Event Photo Store ---

export async function linkPhoto(input: LinkPhotoInput): Promise<EventPhoto> {
  const handle = getDocHandle();
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
  const handle = getDocHandle();
  handle.change((d) => {
    delete d.eventPhotos[id];
  });
}

// --- Photo Storage (local-first, no Supabase) ---
// For now, reuse the same URL-based approach.
// In Phase 3+, this will use blob-store with content-addressed IDs.

export async function uploadPhoto(_eventId: string, file: File): Promise<UploadResult> {
  // Store as a local object URL for now — Phase 3 will add blob sync
  const url = URL.createObjectURL(file);
  return { url, fileName: file.name };
}

export async function deletePhoto(_url: string): Promise<void> {
  // No-op for object URLs; blob cleanup handled in Phase 3
}
