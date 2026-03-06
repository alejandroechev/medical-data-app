import { describe, it, expect } from 'vitest';
import { createFamilyMember, getMemberColor, DEFAULT_MEMBER_COLOR } from '../../../src/domain/models/family-member';

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

  it('should return specific color for known members', () => {
    expect(getMemberColor('Alejandro')).toContain('blue');
    expect(getMemberColor('Daniela')).toContain('fuchsia');
    expect(getMemberColor('Antonio')).toContain('orange');
    expect(getMemberColor('Gaspar')).toContain('teal');
  });

  it('should return default color for unknown members', () => {
    expect(getMemberColor('Desconocido')).toBe(DEFAULT_MEMBER_COLOR);
    expect(getMemberColor('')).toBe(DEFAULT_MEMBER_COLOR);
  });
});
