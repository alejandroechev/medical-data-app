import type { FamilyMember } from '../../domain/models/family-member.js';

// Fixed family members - configured at setup
// Update this list with your family members
const SEED_MEMBERS: FamilyMember[] = [
  { id: '1', nombre: 'Alejandro', parentesco: 'Padre' },
  { id: '2', nombre: 'Pareja', parentesco: 'Madre' },
  { id: '3', nombre: 'Hijo 1', parentesco: 'Hijo/a' },
  { id: '4', nombre: 'Hijo 2', parentesco: 'Hijo/a' },
];

export function getFamilyMembers(): FamilyMember[] {
  return [...SEED_MEMBERS];
}

export function getFamilyMemberById(id: string): FamilyMember | undefined {
  return SEED_MEMBERS.find((m) => m.id === id);
}

export function getFamilyMemberByName(nombre: string): FamilyMember | undefined {
  return SEED_MEMBERS.find(
    (m) => m.nombre.toLowerCase() === nombre.toLowerCase()
  );
}
