import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const server = new McpServer({
  name: 'medical-data',
  version: '1.0.0',
});

// --- list_family_members ---
server.tool('list_family_members', 'List all family members', {}, async () => {
  const { data, error } = await supabase.from('family_members').select('*').order('nombre');
  if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
  const members = (data ?? []).map((m: Record<string, unknown>) => ({
    id: m.id, name: m.nombre, relationship: m.parentesco,
  }));
  return { content: [{ type: 'text', text: JSON.stringify(members, null, 2) }] };
});

// --- list_events ---
server.tool('list_events', 'List medical events with optional filters', {
  patient_name: z.string().optional().describe('Filter by patient name (e.g. "Alejandro")'),
  type: z.string().optional().describe('Filter by event type (e.g. "Consulta Médica", "Receta")'),
  from_date: z.string().optional().describe('From date YYYY-MM-DD'),
  to_date: z.string().optional().describe('To date YYYY-MM-DD'),
  limit: z.number().optional().describe('Max results (default 20)'),
}, async ({ patient_name, type, from_date, to_date, limit }) => {
  let query = supabase.from('medical_events').select('*, family_members!inner(nombre, parentesco)')
    .order('fecha', { ascending: false })
    .limit(limit ?? 20);

  if (type) query = query.eq('tipo', type);
  if (from_date) query = query.gte('fecha', from_date);
  if (to_date) query = query.lte('fecha', to_date);
  if (patient_name) query = query.ilike('family_members.nombre', `%${patient_name}%`);

  const { data, error } = await query;
  if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };

  const events = (data ?? []).map((e: Record<string, unknown>) => {
    const member = e.family_members as Record<string, string> | null;
    return {
      id: e.id, date: e.fecha, type: e.tipo, description: e.descripcion,
      patient: member?.nombre ?? 'Unknown', cost: e.costo,
      isapre_status: e.reembolso_isapre_status, insurance_status: e.reembolso_seguro_status,
    };
  });
  return { content: [{ type: 'text', text: JSON.stringify(events, null, 2) }] };
});

// --- get_event ---
server.tool('get_event', 'Get full details of a medical event by ID', {
  event_id: z.string().describe('The event UUID'),
}, async ({ event_id }) => {
  const { data, error } = await supabase.from('medical_events')
    .select('*, family_members(nombre, parentesco), professionals(name, specialty), locations(name)')
    .eq('id', event_id).single();
  if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

// --- list_treatments ---
server.tool('list_treatments', 'List patient drugs/treatments', {
  patient_name: z.string().optional().describe('Filter by patient name'),
  status: z.enum(['active', 'completed', 'stopped', 'all']).optional().describe('Filter by status (default: all)'),
}, async ({ patient_name, status }) => {
  let query = supabase.from('patient_drugs')
    .select('*, family_members!inner(nombre)')
    .order('start_date', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (patient_name) query = query.ilike('family_members.nombre', `%${patient_name}%`);

  const { data, error } = await query;
  if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };

  const drugs = (data ?? []).map((d: Record<string, unknown>) => {
    const member = d.family_members as Record<string, string> | null;
    return {
      id: d.id, patient: member?.nombre, name: d.name, dosage: d.dosage,
      schedule: d.schedule, duration: d.duration, start_date: d.start_date,
      start_time: d.start_time, status: d.status,
      is_permanent: d.is_permanent, next_pickup_date: d.next_pickup_date,
    };
  });
  return { content: [{ type: 'text', text: JSON.stringify(drugs, null, 2) }] };
});

// --- get_expense_summary ---
server.tool('get_expense_summary', 'Get expense summary by patient and date range', {
  patient_name: z.string().optional().describe('Filter by patient name'),
  from_date: z.string().optional().describe('From date YYYY-MM-DD'),
  to_date: z.string().optional().describe('To date YYYY-MM-DD'),
}, async ({ patient_name, from_date, to_date }) => {
  let query = supabase.from('medical_events')
    .select('costo, reembolso_isapre_status, reembolso_seguro_status, family_members!inner(nombre)')
    .not('costo', 'is', null);

  if (patient_name) query = query.ilike('family_members.nombre', `%${patient_name}%`);
  if (from_date) query = query.gte('fecha', from_date);
  if (to_date) query = query.lte('fecha', to_date);

  const { data, error } = await query;
  if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };

  const events = data ?? [];
  const totalCost = events.reduce((s: number, e: Record<string, unknown>) => s + ((e.costo as number) ?? 0), 0);
  const approvedIsapre = events.filter((e: Record<string, unknown>) => e.reembolso_isapre_status === 'approved')
    .reduce((s: number, e: Record<string, unknown>) => s + ((e.costo as number) ?? 0), 0);
  const approvedInsurance = events.filter((e: Record<string, unknown>) => e.reembolso_seguro_status === 'approved')
    .reduce((s: number, e: Record<string, unknown>) => s + ((e.costo as number) ?? 0), 0);
  const pending = events.filter((e: Record<string, unknown>) =>
    e.reembolso_isapre_status === 'requested' || e.reembolso_seguro_status === 'requested')
    .reduce((s: number, e: Record<string, unknown>) => s + ((e.costo as number) ?? 0), 0);

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
  let query = supabase.from('medical_events')
    .select('reembolso_isapre_status, reembolso_seguro_status, family_members!inner(nombre)');

  if (patient_name) query = query.ilike('family_members.nombre', `%${patient_name}%`);

  const { data, error } = await query;
  if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };

  const events = data ?? [];
  const summary = {
    isapre: {
      pending: events.filter((e: Record<string, unknown>) => e.reembolso_isapre_status === 'requested').length,
      approved: events.filter((e: Record<string, unknown>) => e.reembolso_isapre_status === 'approved').length,
      rejected: events.filter((e: Record<string, unknown>) => e.reembolso_isapre_status === 'rejected').length,
    },
    insurance: {
      pending: events.filter((e: Record<string, unknown>) => e.reembolso_seguro_status === 'requested').length,
      approved: events.filter((e: Record<string, unknown>) => e.reembolso_seguro_status === 'approved').length,
      rejected: events.filter((e: Record<string, unknown>) => e.reembolso_seguro_status === 'rejected').length,
    },
    total_events: events.length,
  };
  return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
});

// --- list_event_documents ---
server.tool('list_event_documents', 'List documents/photos linked to an event', {
  event_id: z.string().describe('The event UUID'),
}, async ({ event_id }) => {
  const { data, error } = await supabase.from('event_photos')
    .select('*').eq('evento_id', event_id).order('creado_en');
  if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };

  const docs = (data ?? []).map((d: Record<string, unknown>) => ({
    id: d.id, url: d.google_photos_url, description: d.descripcion,
  }));
  return { content: [{ type: 'text', text: JSON.stringify(docs, null, 2) }] };
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
