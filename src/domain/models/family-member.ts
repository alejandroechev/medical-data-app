export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
}

export const FAMILY_MEMBERS: FamilyMember[] = [];

export function createFamilyMember(
  id: string,
  name: string,
  relationship: string
): FamilyMember {
  return { id, name, relationship };
}
