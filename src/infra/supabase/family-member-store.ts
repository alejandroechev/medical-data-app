import type { FamilyMember } from '../../domain/models/family-member.js';

// Fixed family members - configured at setup
// Update this list with your family members
const SEED_MEMBERS: FamilyMember[] = [
  { id: '1', name: 'Alejandro', relationship: 'Padre' },
  { id: '2', name: 'Pareja', relationship: 'Madre' },
  { id: '3', name: 'Hijo 1', relationship: 'Hijo/a' },
  { id: '4', name: 'Hijo 2', relationship: 'Hijo/a' },
];

export function getFamilyMembers(): FamilyMember[] {
  return [...SEED_MEMBERS];
}

export function getFamilyMemberById(id: string): FamilyMember | undefined {
  return SEED_MEMBERS.find((m) => m.id === id);
}

export function getFamilyMemberByName(name: string): FamilyMember | undefined {
  return SEED_MEMBERS.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  );
}
