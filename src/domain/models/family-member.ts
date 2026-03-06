export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
}

export const FAMILY_MEMBERS: FamilyMember[] = [];

export const MEMBER_COLORS: Record<string, string> = {
  'Alejandro': 'bg-cyan-100 text-cyan-800',
  'Daniela': 'bg-fuchsia-100 text-fuchsia-800',
  'Antonio': 'bg-orange-100 text-orange-800',
  'Gaspar': 'bg-teal-100 text-teal-800',
};

export const DEFAULT_MEMBER_COLOR = 'bg-gray-100 text-gray-600';

export function getMemberColor(name: string): string {
  return MEMBER_COLORS[name] ?? DEFAULT_MEMBER_COLOR;
}

export function createFamilyMember(
  id: string,
  name: string,
  relationship: string
): FamilyMember {
  return { id, name, relationship };
}
