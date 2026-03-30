import { v4 as uuidv4 } from "uuid";
import { getDocHandle, waitForDoc } from "./repo.js";
import type { Professional, Location } from "../../domain/models/professional-location.js";

// --- Professionals ---

export async function createProfessional(name: string, specialty?: string): Promise<Professional> {
  const handle = getDocHandle();
  const id = uuidv4();
  const now = new Date().toISOString();

  const professional: Professional = { id, name, specialty, createdAt: now };

  handle.change((d) => {
    if (!d.professionals) d.professionals = {};
    d.professionals[id] = professional;
  });

  return { ...professional };
}

export async function listProfessionals(): Promise<Professional[]> {
  const doc = await waitForDoc();
  return Object.values(doc.professionals || {}).map((p) => ({ ...p }));
}

export async function getProfessionalById(id: string): Promise<Professional | undefined> {
  const doc = await waitForDoc();
  const p = doc.professionals?.[id];
  return p ? { ...p } : undefined;
}

// --- Locations ---

export async function createLocation(name: string): Promise<Location> {
  const handle = getDocHandle();
  const id = uuidv4();
  const now = new Date().toISOString();

  const location: Location = { id, name, createdAt: now };

  handle.change((d) => {
    if (!d.locations) d.locations = {};
    d.locations[id] = location;
  });

  return { ...location };
}

export async function listLocations(): Promise<Location[]> {
  const doc = await waitForDoc();
  return Object.values(doc.locations || {}).map((l) => ({ ...l }));
}

export async function getLocationById(id: string): Promise<Location | undefined> {
  const doc = await waitForDoc();
  const l = doc.locations?.[id];
  return l ? { ...l } : undefined;
}
