import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Repo } from '@automerge/automerge-repo';
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import WebSocket from 'ws';

import type { AutomergeUrl, DocHandle } from '@automerge/automerge-repo';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// --- Config ---
const SYNC_SERVER_URL = process.env.VITE_SYNC_SERVER_URL ?? 'ws://localhost:3030';
const DOC_URL = process.env.VITE_AUTOMERGE_DOC_URL ?? '';
const REGISTRATION_KEY = process.env.REGISTRATION_KEY ?? '';

if (!DOC_URL) {
  process.stderr.write('Error: VITE_AUTOMERGE_DOC_URL not set. Cannot connect to Automerge document.\n');
  process.exit(1);
}

// --- Family member seed data (same as app) ---
interface FamilyMember { id: string; name: string; relationship: string; }
const FAMILY_MEMBERS: FamilyMember[] = [
  { id: '861ac938-aad9-4172-b21a-b7be9ff10676', name: 'Alejandro', relationship: 'Padre' },
  { id: '73877ce7-d43f-47ad-8752-fc966e659189', name: 'Daniela', relationship: 'Madre' },
  { id: 'c8af6b39-c4ae-451c-87cc-9e68ab02b3f7', name: 'Antonio', relationship: 'Hijo' },
  { id: '2c26a593-c699-41e9-8c57-5056349ef861', name: 'Gaspar', relationship: 'Hijo' },
];
const memberById = new Map(FAMILY_MEMBERS.map(m => [m.id, m]));
const memberByName = new Map(FAMILY_MEMBERS.map(m => [m.name.toLowerCase(), m]));

// --- Automerge document types (mirrors src/infra/automerge/schema.ts) ---
interface MedAppDoc {
  schemaVersion: number;
  medicalEvents: Record<string, MedicalEvent>;
  eventPhotos: Record<string, EventPhoto>;
  eventRecordings: Record<string, EventRecording>;
  professionals: Record<string, Professional>;
  locations: Record<string, Location>;
  prescriptionDrugs: Record<string, PrescriptionDrug>;
  patientDrugs: Record<string, PatientDrug>;
}
interface MedicalEvent {
  id: string; date: string; type: string; description: string; patientId: string;
  professionalId?: string; locationId?: string; parentEventId?: string; cost?: number;
  isapreReimbursementStatus: string; insuranceReimbursementStatus: string;
  createdAt: string; updatedAt: string;
}
interface EventPhoto { id: string; eventId: string; googlePhotosUrl: string; googlePhotosId: string; description?: string; createdAt: string; }
interface EventRecording { id: string; eventId: string; recordingUrl: string; fileName: string; durationSeconds?: number; description?: string; createdAt: string; }
interface Professional { id: string; name: string; specialty?: string; createdAt: string; }
interface Location { id: string; name: string; createdAt: string; }
interface PrescriptionDrug { id: string; eventId: string; name: string; dosage: string; frequency: string; durationDays?: number; createdAt: string; }
interface PatientDrug {
  id: string; patientId: string; eventId?: string; name: string; dosage: string;
  schedule: unknown; duration: unknown; startDate: string; startTime?: string;
  endDate?: string; isPermanent: boolean; nextPickupDate?: string; status: string; createdAt: string;
}

// --- Auth: register MCP as a device ---
async function getAuthToken(): Promise<string | null> {
  const httpUrl = SYNC_SERVER_URL.replace(/^ws/, 'http');
  try {
    const health = await fetch(`${httpUrl}/health`).then(r => r.json());
    if (!health.authEnabled) return null;
  } catch {
    return null; // server unreachable
  }

  // Check for cached token
  const TOKEN_FILE = path.resolve(__dirname, '../../.mcp-token');
  const fs = await import('fs');
  if (fs.existsSync(TOKEN_FILE)) {
    const token = fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
    // Validate token
    const httpUrl = SYNC_SERVER_URL.replace(/^ws/, 'http');
    try {
      const res = await fetch(`${httpUrl}/auth/devices`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) return token;
    } catch { /* fall through to re-register */ }
  }

  if (!REGISTRATION_KEY) {
    process.stderr.write('Error: Server requires auth but REGISTRATION_KEY not set.\n');
    return null;
  }

  // Register
  const httpUrl2 = SYNC_SERVER_URL.replace(/^ws/, 'http');
  const res = await fetch(`${httpUrl2}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceName: 'MCP Server', registrationKey: REGISTRATION_KEY }),
  });
  if (!res.ok) {
    process.stderr.write(`Auth registration failed: ${res.status}\n`);
    return null;
  }
  const { jwt } = await res.json();
  fs.writeFileSync(TOKEN_FILE, jwt);
  process.stderr.write('Registered MCP Server device with sync server.\n');
  return jwt;
}

// --- Connect to Automerge ---
async function connectToDoc(): Promise<DocHandle<MedAppDoc>> {
  (globalThis as any).WebSocket = WebSocket;

  const token = await getAuthToken();
  const wsUrl = token ? `${SYNC_SERVER_URL}?token=${encodeURIComponent(token)}` : SYNC_SERVER_URL;

  const repo = new Repo({
    network: [new BrowserWebSocketClientAdapter(wsUrl)],
  });

  const handle = await repo.find<MedAppDoc>(DOC_URL as AutomergeUrl);

  // Wait for document to load
  let retries = 0;
  while (!handle.doc() && retries < 30) {
    await new Promise(r => setTimeout(r, 500));
    retries++;
  }
  if (!handle.doc()) {
    throw new Error('Failed to load Automerge document after 15s');
  }

  process.stderr.write(`Connected to Automerge doc: ${DOC_URL}\n`);
  return handle;
}

// --- Initialize ---
const docHandle = await connectToDoc();
function getDoc(): MedAppDoc {
  const doc = docHandle.doc();
  if (!doc) throw new Error('Document not loaded');
  return doc;
}

const server = new McpServer({ name: 'medical-data', version: '2.0.0' });

// --- list_family_members ---
server.tool('list_family_members', 'List all family members', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify(FAMILY_MEMBERS, null, 2) }] };
});

// --- list_events ---
server.tool('list_events', 'List medical events with optional filters', {
  patient_name: z.string().optional().describe('Filter by patient name (e.g. "Alejandro")'),
  type: z.string().optional().describe('Filter by event type (e.g. "Consulta Médica", "Receta")'),
  from_date: z.string().optional().describe('From date YYYY-MM-DD'),
  to_date: z.string().optional().describe('To date YYYY-MM-DD'),
  limit: z.number().optional().describe('Max results (default 20)'),
}, async ({ patient_name, type, from_date, to_date, limit }) => {
  const doc = getDoc();
  let events = Object.values(doc.medicalEvents ?? {});

  if (type) events = events.filter(e => e.type === type);
  if (from_date) events = events.filter(e => e.date >= from_date);
  if (to_date) events = events.filter(e => e.date <= to_date);
  if (patient_name) {
    const search = patient_name.toLowerCase();
    events = events.filter(e => {
      const m = memberById.get(e.patientId);
      return m && m.name.toLowerCase().includes(search);
    });
  }

  events.sort((a, b) => b.date.localeCompare(a.date));
  events = events.slice(0, limit ?? 20);

  const result = events.map(e => ({
    id: e.id, date: e.date, type: e.type, description: e.description,
    patient: memberById.get(e.patientId)?.name ?? 'Unknown', cost: e.cost,
    isapre_status: e.isapreReimbursementStatus, insurance_status: e.insuranceReimbursementStatus,
  }));
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// --- get_event ---
server.tool('get_event', 'Get full details of a medical event by ID', {
  event_id: z.string().describe('The event UUID'),
}, async ({ event_id }) => {
  const doc = getDoc();
  const event = doc.medicalEvents?.[event_id];
  if (!event) return { content: [{ type: 'text', text: 'Event not found' }] };

  const patient = memberById.get(event.patientId);
  const professional = event.professionalId ? doc.professionals?.[event.professionalId] : undefined;
  const location = event.locationId ? doc.locations?.[event.locationId] : undefined;

  const result = {
    ...event,
    patient: patient ? { name: patient.name, relationship: patient.relationship } : null,
    professional: professional ? { name: professional.name, specialty: professional.specialty } : null,
    location: location ? { name: location.name } : null,
  };
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// --- list_treatments ---
server.tool('list_treatments', 'List patient drugs/treatments', {
  patient_name: z.string().optional().describe('Filter by patient name'),
  status: z.enum(['active', 'completed', 'stopped', 'all']).optional().describe('Filter by status (default: all)'),
}, async ({ patient_name, status }) => {
  const doc = getDoc();
  let drugs = Object.values(doc.patientDrugs ?? {});

  if (status && status !== 'all') drugs = drugs.filter(d => d.status === status);
  if (patient_name) {
    const search = patient_name.toLowerCase();
    drugs = drugs.filter(d => {
      const m = memberById.get(d.patientId);
      return m && m.name.toLowerCase().includes(search);
    });
  }

  drugs.sort((a, b) => b.startDate.localeCompare(a.startDate));

  const result = drugs.map(d => ({
    id: d.id, patient: memberById.get(d.patientId)?.name, name: d.name, dosage: d.dosage,
    schedule: d.schedule, duration: d.duration, start_date: d.startDate,
    start_time: d.startTime, status: d.status,
    is_permanent: d.isPermanent, next_pickup_date: d.nextPickupDate,
  }));
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// --- get_expense_summary ---
server.tool('get_expense_summary', 'Get expense summary by patient and date range', {
  patient_name: z.string().optional().describe('Filter by patient name'),
  from_date: z.string().optional().describe('From date YYYY-MM-DD'),
  to_date: z.string().optional().describe('To date YYYY-MM-DD'),
}, async ({ patient_name, from_date, to_date }) => {
  const doc = getDoc();
  let events = Object.values(doc.medicalEvents ?? {}).filter(e => e.cost != null);

  if (patient_name) {
    const search = patient_name.toLowerCase();
    events = events.filter(e => memberById.get(e.patientId)?.name.toLowerCase().includes(search));
  }
  if (from_date) events = events.filter(e => e.date >= from_date);
  if (to_date) events = events.filter(e => e.date <= to_date);

  const totalCost = events.reduce((s, e) => s + (e.cost ?? 0), 0);
  const approvedIsapre = events.filter(e => e.isapreReimbursementStatus === 'approved').reduce((s, e) => s + (e.cost ?? 0), 0);
  const approvedInsurance = events.filter(e => e.insuranceReimbursementStatus === 'approved').reduce((s, e) => s + (e.cost ?? 0), 0);
  const pending = events.filter(e => e.isapreReimbursementStatus === 'requested' || e.insuranceReimbursementStatus === 'requested').reduce((s, e) => s + (e.cost ?? 0), 0);

  const summary = {
    total_cost: totalCost,
    reimbursed_isapre: approvedIsapre,
    reimbursed_insurance: approvedInsurance,
    pending_reimbursement: pending,
    out_of_pocket: totalCost - approvedIsapre - approvedInsurance,
    event_count: events.length,
  };
  return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
});

// --- get_reimbursement_status ---
server.tool('get_reimbursement_status', 'Get pending and approved reimbursement counts', {
  patient_name: z.string().optional().describe('Filter by patient name'),
}, async ({ patient_name }) => {
  const doc = getDoc();
  let events = Object.values(doc.medicalEvents ?? {});

  if (patient_name) {
    const search = patient_name.toLowerCase();
    events = events.filter(e => memberById.get(e.patientId)?.name.toLowerCase().includes(search));
  }

  const summary = {
    isapre: {
      pending: events.filter(e => e.isapreReimbursementStatus === 'requested').length,
      approved: events.filter(e => e.isapreReimbursementStatus === 'approved').length,
      rejected: events.filter(e => e.isapreReimbursementStatus === 'rejected').length,
    },
    insurance: {
      pending: events.filter(e => e.insuranceReimbursementStatus === 'requested').length,
      approved: events.filter(e => e.insuranceReimbursementStatus === 'approved').length,
      rejected: events.filter(e => e.insuranceReimbursementStatus === 'rejected').length,
    },
    total_events: events.length,
  };
  return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
});

// --- list_event_documents ---
server.tool('list_event_documents', 'List documents/photos linked to an event', {
  event_id: z.string().describe('The event UUID'),
}, async ({ event_id }) => {
  const doc = getDoc();
  const photos = Object.values(doc.eventPhotos ?? {}).filter(p => p.eventId === event_id);

  const result = photos.map(p => ({
    id: p.id, url: p.googlePhotosUrl, description: p.description,
  }));
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
