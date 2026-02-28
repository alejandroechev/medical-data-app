export interface FamilyMember {
  id: string;
  nombre: string;
  parentesco: string;
}

export const FAMILY_MEMBERS: FamilyMember[] = [];

export function createFamilyMember(
  id: string,
  nombre: string,
  parentesco: string
): FamilyMember {
  return { id, nombre, parentesco };
}
