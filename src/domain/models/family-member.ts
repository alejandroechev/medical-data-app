export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
}

export const FAMILY_MEMBERS: FamilyMember[] = [];

export const MEMBER_COLORS: Record<string, string> = {
  'Alejandro': 'bg-blue-100 text-blue-700',
  'Daniela': 'bg-purple-100 text-purple-700',
  'Antonio': 'bg-amber-100 text-amber-700',
  'Gaspar': 'bg-emerald-100 text-emerald-700',
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
