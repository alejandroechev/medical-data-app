import { describe, it, expect } from 'vitest';
import {
  getFamilyMembers,
  getFamilyMemberById,
  getFamilyMemberByName,
} from '../../../src/infra/supabase/family-member-store';

describe('FamilyMemberStore', () => {
  it('should return the family members list', () => {
    const members = getFamilyMembers();
    expect(members.length).toBeGreaterThan(0);
    expect(members[0]).toHaveProperty('id');
    expect(members[0]).toHaveProperty('name');
    expect(members[0]).toHaveProperty('relationship');
  });

  it('should return a copy, not the original reference', () => {
    const a = getFamilyMembers();
    const b = getFamilyMembers();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it('should find a member by ID', () => {
    const member = getFamilyMemberById('1');
    expect(member).toBeDefined();
    expect(member!.id).toBe('1');
  });

  it('should return undefined for non-existent ID', () => {
    const member = getFamilyMemberById('999');
    expect(member).toBeUndefined();
  });

  it('should find a member by name (case insensitive)', () => {
    const members = getFamilyMembers();
    const firstName = members[0].name;
    const member = getFamilyMemberByName(firstName.toLowerCase());
    expect(member).toBeDefined();
    expect(member!.name).toBe(firstName);
  });

  it('should return undefined for non-existent name', () => {
    const member = getFamilyMemberByName('NoExiste');
    expect(member).toBeUndefined();
  });
});
