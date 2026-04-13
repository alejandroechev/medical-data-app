/**
 * Schema migration framework for Automerge documents.
 *
 * Each migration is a function that mutates the document in-place.
 * Migrations are numbered sequentially and run in order.
 * The document's schemaVersion tracks which migrations have been applied.
 *
 * To add a new migration:
 * 1. Add a function to the `migrations` array below
 * 2. Bump CURRENT_SCHEMA_VERSION in schema.ts
 * 3. The migration runs automatically on document load
 */

import type { DocHandle } from "@automerge/automerge-repo";
import type { MedAppDoc } from "./schema.js";
import { CURRENT_SCHEMA_VERSION } from "./schema.js";

type Migration = (doc: MedAppDoc) => void;

/**
 * Ordered list of migrations. Index 0 = migration from version 0 → 1, etc.
 * Each function receives a mutable Automerge document proxy.
 */
const migrations: Migration[] = [
  // Migration 0 → 1: Add schemaVersion field to existing documents
  (doc) => {
    // Ensure all collection maps exist (older docs may be missing them)
    if (!doc.medicalEvents) doc.medicalEvents = {};
    if (!doc.eventPhotos) doc.eventPhotos = {};
    if (!doc.eventRecordings) doc.eventRecordings = {};
    if (!doc.professionals) doc.professionals = {};
    if (!doc.locations) doc.locations = {};
    if (!doc.prescriptionDrugs) doc.prescriptionDrugs = {};
    if (!doc.patientDrugs) doc.patientDrugs = {};
  },

  // Migration 1 → 2: no-op. Existing events simply omit `isArchived`,
  // and undefined is treated as "not archived".
  () => {},
];

/**
 * Run any pending migrations on the document.
 * Call this after loading a document from storage or network.
 */
export function migrateDocument(handle: DocHandle<MedAppDoc>): void {
  const doc = handle.doc();
  if (!doc) return;

  const currentVersion = doc.schemaVersion ?? 0;

  if (currentVersion >= CURRENT_SCHEMA_VERSION) return;

  console.log(`📋 Migrating document schema: v${currentVersion} → v${CURRENT_SCHEMA_VERSION}`);

  handle.change((d) => {
    for (let v = currentVersion; v < CURRENT_SCHEMA_VERSION; v++) {
      const migration = migrations[v];
      if (migration) {
        console.log(`  Running migration ${v} → ${v + 1}`);
        migration(d);
      }
    }
    d.schemaVersion = CURRENT_SCHEMA_VERSION;
  });

  console.log(`✅ Schema migration complete`);
}
