import type { FamilyMember } from '../models/family-member.js';

export interface FamilyMemberRepository {
  list(): Promise<FamilyMember[]>;
  getById(id: string): Promise<FamilyMember | null>;
}
