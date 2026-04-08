import type { FamilyMember } from '../../domain/models/family-member.js';
import { supabase } from './client.js';

// Seed data with real Supabase IDs (used by all backends for consistent patient mapping)
const SEED_MEMBERS: FamilyMember[] = [
  { id: '861ac938-aad9-4172-b21a-b7be9ff10676', name: 'Alejandro', relationship: 'Padre' },
  { id: '73877ce7-d43f-47ad-8752-fc966e659189', name: 'Daniela', relationship: 'Madre' },
  { id: 'c8af6b39-c4ae-451c-87cc-9e68ab02b3f7', name: 'Antonio', relationship: 'Hijo' },
  { id: '2c26a593-c699-41e9-8c57-5056349ef861', name: 'Gaspar', relationship: 'Hijo' },
];

// Cached members loaded from Supabase
let cachedMembers: FamilyMember[] | null = null;

interface DbFamilyMember {
  id: string;
  nombre: string;
  parentesco: string;
}

async function loadFromSupabase(): Promise<FamilyMember[]> {
  if (!supabase) return SEED_MEMBERS;

  const { data, error } = await supabase
    .from('family_members')
    .select()
    .order('nombre');

  if (error || !data || data.length === 0) return SEED_MEMBERS;

  return (data as DbFamilyMember[]).map((row) => ({
    id: row.id,
    name: row.nombre,
    relationship: row.parentesco,
  }));
}

export async function loadFamilyMembers(): Promise<FamilyMember[]> {
  if (!cachedMembers) {
    cachedMembers = await loadFromSupabase();
  }
  return cachedMembers;
}

export function getFamilyMembers(): FamilyMember[] {
  return cachedMembers ? [...cachedMembers] : [...SEED_MEMBERS];
}

export function getFamilyMemberById(id: string): FamilyMember | undefined {
  const members = cachedMembers ?? SEED_MEMBERS;
  return members.find((m) => m.id === id);
}

export function getFamilyMemberByName(name: string): FamilyMember | undefined {
  const members = cachedMembers ?? SEED_MEMBERS;
  return members.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  );
}
