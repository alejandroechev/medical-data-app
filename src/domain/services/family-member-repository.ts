import type { FamilyMember } from '../models/family-member.js';

export interface FamilyMemberRepository {
  listar(): Promise<FamilyMember[]>;
  obtenerPorId(id: string): Promise<FamilyMember | null>;
}
