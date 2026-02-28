import { describe, it, expect } from 'vitest';
import { createFamilyMember } from '../../../src/domain/models/family-member';

describe('FamilyMember', () => {
  it('should create a family member with correct fields', () => {
    const member = createFamilyMember('1', 'Juan Pérez', 'Padre');
    expect(member).toEqual({
      id: '1',
      name: 'Juan Pérez',
      relationship: 'Padre',
    });
  });

  it('should preserve all special characters in the name', () => {
    const member = createFamilyMember('2', 'María José García', 'Madre');
    expect(member.name).toBe('María José García');
  });
});
