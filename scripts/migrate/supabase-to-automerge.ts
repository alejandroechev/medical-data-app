#!/usr/bin/env npx tsx
/**
 * Migration script: Supabase → Automerge
 *
 * Reads all data from Supabase PostgreSQL and writes it into an Automerge document,
 * syncing via the sync server at sync.stormlab.app.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... VITE_SYNC_SERVER_URL=ws://localhost:3030 npx tsx scripts/migrate/supabase-to-automerge.ts
 *
 * The script will:
 *   1. Read all tables from Supabase
 *   2. Map DB columns → domain model fields
 *   3. Write everything into a new Automerge document
 *   4. Sync the document to the sync server
 *   5. Print the document URL (save this — it's how clients connect to the same doc)
 */

import { createClient } from '@supabase/supabase-js';
import { Repo } from '@automerge/automerge-repo';
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import WebSocket from 'ws';
import fs from 'fs';

import type { MedicalEvent, ReimbursementStatus } from '../../src/domain/models/medical-event.js';
import type { EventPhoto } from '../../src/domain/models/event-photo.js';
import type { EventRecording } from '../../src/domain/models/event-recording.js';
import type { PrescriptionDrug, PatientDrug, DrugSchedule, DrugDuration, DrugStatus } from '../../src/domain/models/prescription-drug.js';
import type { Professional, Location } from '../../src/domain/models/professional-location.js';

// --- Config ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SYNC_SERVER_URL = process.env.VITE_SYNC_SERVER_URL || 'ws://localhost:3030';
const REGISTRATION_KEY = process.env.REGISTRATION_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Auth helper: register a migration device and get token ---

async function getAuthToken(): Promise<string | null> {
  const httpUrl = SYNC_SERVER_URL.replace(/^ws/, 'http');
  const health = await fetch(`${httpUrl}/health`).then(r => r.json());
  
  if (!health.authEnabled) return null;
  
  if (!REGISTRATION_KEY) {
    console.error('❌ Server requires auth. Set REGISTRATION_KEY env var.');
    process.exit(1);
  }
  
  const res = await fetch(`${httpUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceName: 'Migration Script', registrationKey: REGISTRATION_KEY }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('❌ Auth registration failed:', err.error || res.status);
    process.exit(1);
  }
  
  const { jwt } = await res.json();
  console.log('🔑 Authenticated with sync server');
  return jwt;
}

// --- Automerge doc shape (must match src/infra/automerge/schema.ts) ---
interface MedAppDoc {
  medicalEvents: { [id: string]: MedicalEvent };
  eventPhotos: { [id: string]: EventPhoto };
  eventRecordings: { [id: string]: EventRecording };
  professionals: { [id: string]: Professional };
  locations: { [id: string]: Location };
  prescriptionDrugs: { [id: string]: PrescriptionDrug };
  patientDrugs: { [id: string]: PatientDrug };
}

// --- Row mappers (DB columns → domain models) ---

function mapEvent(row: any): MedicalEvent {
  return {
    id: row.id,
    date: row.fecha,
    type: row.tipo,
    description: row.descripcion,
    patientId: row.paciente_id,
    ...(row.professional_id && { professionalId: row.professional_id }),
    ...(row.location_id && { locationId: row.location_id }),
    ...(row.parent_event_id && { parentEventId: row.parent_event_id }),
    ...(row.costo != null && { cost: row.costo }),
    isapreReimbursementStatus: (row.reembolso_isapre_status ?? 'none') as ReimbursementStatus,
    insuranceReimbursementStatus: (row.reembolso_seguro_status ?? 'none') as ReimbursementStatus,
    createdAt: row.creado_en,
    updatedAt: row.actualizado_en,
  };
}

function mapPhoto(row: any): EventPhoto {
  return {
    id: row.id,
    eventId: row.evento_id,
    googlePhotosUrl: row.google_photos_url,
    googlePhotosId: row.google_photos_id,
    description: row.descripcion ?? undefined,
    createdAt: row.creado_en,
  };
}

function mapRecording(row: any): EventRecording {
  return {
    id: row.id,
    eventId: row.event_id,
    recordingUrl: row.recording_url,
    fileName: row.file_name,
    durationSeconds: row.duration_seconds ?? undefined,
    description: row.description ?? undefined,
    createdAt: row.created_at,
  };
}

function mapProfessional(row: any): Professional {
  return {
    id: row.id,
    name: row.name,
    ...(row.specialty && { specialty: row.specialty }),
    createdAt: row.created_at,
  };
}

function mapLocation(row: any): Location {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function mapPrescriptionDrug(row: any): PrescriptionDrug {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    durationDays: row.duration_days ?? undefined,
    createdAt: row.created_at,
  };
}

function mapPatientDrug(row: any): PatientDrug {
  return {
    id: row.id,
    patientId: row.patient_id,
    ...(row.event_id && { eventId: row.event_id }),
    name: row.name,
    dosage: row.dosage,
    schedule: (typeof row.schedule === 'string' ? JSON.parse(row.schedule) : row.schedule) as DrugSchedule,
    duration: (typeof row.duration === 'string' ? JSON.parse(row.duration) : row.duration) as DrugDuration,
    startDate: row.start_date,
    ...(row.start_time && { startTime: row.start_time }),
    ...(row.end_date && { endDate: row.end_date }),
    isPermanent: row.is_permanent,
    ...(row.next_pickup_date && { nextPickupDate: row.next_pickup_date }),
    status: row.status as DrugStatus,
    createdAt: row.created_at,
  };
}

// --- Fetch all data from Supabase ---

async function fetchAll<T>(table: string, mapper: (row: any) => T): Promise<T[]> {
  const { data, error } = await supabase.from(table).select();
  if (error) {
    console.error(`❌ Error fetching ${table}:`, error.message);
    return [];
  }
  console.log(`  📥 ${table}: ${data.length} rows`);
  return data.map(mapper);
}

// --- Strip undefined values (Automerge doesn't allow undefined, only null or omit) ---

function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined) as T;
  const result: any = {};
  for (const [key, value] of Object.entries(obj as any)) {
    if (value !== undefined) {
      result[key] = stripUndefined(value);
    }
  }
  return result as T;
}

// --- Main ---

async function main() {
  console.log('🚀 Starting Supabase → Automerge migration\n');
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Sync server: ${SYNC_SERVER_URL}\n`);

  // 1. Fetch all data from Supabase
  console.log('📦 Fetching data from Supabase...');
  const events = await fetchAll('medical_events', mapEvent);
  const photos = await fetchAll('event_photos', mapPhoto);
  const recordings = await fetchAll('event_recordings', mapRecording);
  const professionals = await fetchAll('professionals', mapProfessional);
  const locations = await fetchAll('locations', mapLocation);
  const prescriptionDrugs = await fetchAll('prescription_drugs', mapPrescriptionDrug);
  const patientDrugs = await fetchAll('patient_drugs', mapPatientDrug);

  const totalRecords = events.length + photos.length + recordings.length +
    professionals.length + locations.length + prescriptionDrugs.length + patientDrugs.length;
  console.log(`\n✅ Fetched ${totalRecords} total records\n`);

  // 2. Create Automerge repo with WebSocket connection to sync server
  console.log('🔄 Connecting to sync server...');

  // Authenticate if needed
  const token = await getAuthToken();
  const wsUrl = token ? `${SYNC_SERVER_URL}?token=${encodeURIComponent(token)}` : SYNC_SERVER_URL;

  // Patch global WebSocket for Node.js
  (globalThis as any).WebSocket = WebSocket;

  const repo = new Repo({
    network: [new BrowserWebSocketClientAdapter(wsUrl)],
  });

  // 3. Create the Automerge document with all data
  console.log('📝 Creating Automerge document...');

  const toMap = <T extends { id: string }>(items: T[]): { [id: string]: T } =>
    Object.fromEntries(items.map((item) => [item.id, stripUndefined(item)]));

  const initialDoc: MedAppDoc = {
    medicalEvents: toMap(events),
    eventPhotos: toMap(photos),
    eventRecordings: toMap(recordings),
    professionals: toMap(professionals),
    locations: toMap(locations),
    prescriptionDrugs: toMap(prescriptionDrugs),
    patientDrugs: toMap(patientDrugs),
  };

  const handle = repo.create<MedAppDoc>();
  handle.change((d) => {
    Object.assign(d, initialDoc);
  });

  console.log(`\n✅ Document created: ${handle.url}`);
  console.log('\n⏳ Waiting for sync to complete...');

  // Wait for sync
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('\n' + '='.repeat(60));
  console.log('🎉 MIGRATION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📋 Document URL (SAVE THIS):\n\n   ${handle.url}\n`);
  console.log('To use this document in the medapp, set in .env.local:');
  console.log(`   VITE_STORAGE_BACKEND=automerge`);
  console.log(`   VITE_SYNC_SERVER_URL=${SYNC_SERVER_URL}`);
  console.log(`\nThen store this URL in localStorage key "medapp-automerge-doc-url"`);
  console.log('on each device/browser that should access this data.\n');

  console.log('📊 Migration summary:');
  console.log(`   Medical events:    ${events.length}`);
  console.log(`   Photos:            ${photos.length}`);
  console.log(`   Recordings:        ${recordings.length}`);
  console.log(`   Professionals:     ${professionals.length}`);
  console.log(`   Locations:         ${locations.length}`);
  console.log(`   Prescription drugs: ${prescriptionDrugs.length}`);
  console.log(`   Patient drugs:     ${patientDrugs.length}`);
  console.log(`   TOTAL:             ${totalRecords}`);

  // Cleanup
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
