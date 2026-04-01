/**
 * Automerge document schema for MedApp.
 * Single document containing all entities (suitable for personal/family app).
 * Blob data (photos, recordings) stored separately — only references here.
 */

import type { MedicalEvent } from "../../domain/models/medical-event.js";
import type { PrescriptionDrug, PatientDrug } from "../../domain/models/prescription-drug.js";
import type { Professional, Location } from "../../domain/models/professional-location.js";

/** Photo reference stored in Automerge (actual bytes in blob store) */
export interface AutomergeEventPhoto {
  id: string;
  eventId: string;
  googlePhotosUrl: string; // keep field name for compat — may be blob URL or external
  googlePhotosId: string;  // keep field name for compat — may be blobId or filename
  description?: string;
  createdAt: string;
}

/** Recording reference stored in Automerge (actual bytes in blob store) */
export interface AutomergeEventRecording {
  id: string;
  eventId: string;
  recordingUrl: string;   // may be blob URL or external
  fileName: string;
  durationSeconds?: number;
  description?: string;
  createdAt: string;
}

/** Root document shape */
export interface MedAppDoc {
  medicalEvents: { [id: string]: MedicalEvent };
  eventPhotos: { [id: string]: AutomergeEventPhoto };
  eventRecordings: { [id: string]: AutomergeEventRecording };
  professionals: { [id: string]: Professional };
  locations: { [id: string]: Location };
  prescriptionDrugs: { [id: string]: PrescriptionDrug };
  patientDrugs: { [id: string]: PatientDrug };
}
