import type { FamilyMember } from '../../domain/models/family-member.js';
import { supabase } from './client.js';

// Fallback seed data for in-memory mode
const SEED_MEMBERS: FamilyMember[] = [
  { id: '1', name: 'Alejandro', relationship: 'Padre' },
  { id: '2', name: 'Daniela', relationship: 'Madre' },
  { id: '3', name: 'Antonio', relationship: 'Hijo' },
  { id: '4', name: 'Gaspar', relationship: 'Hijo' },
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
