import { describe, it, expect } from 'vitest';
import {
  getFamilyMembers,
  getFamilyMemberById,
  getFamilyMemberByName,
} from '../../../src/infra/supabase/family-member-store';

describe('FamilyMemberStore', () => {
  it('debe retornar la lista de miembros de familia', () => {
    const members = getFamilyMembers();
    expect(members.length).toBeGreaterThan(0);
    expect(members[0]).toHaveProperty('id');
    expect(members[0]).toHaveProperty('nombre');
    expect(members[0]).toHaveProperty('parentesco');
  });

  it('debe retornar una copia, no la referencia original', () => {
    const a = getFamilyMembers();
    const b = getFamilyMembers();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it('debe encontrar un miembro por ID', () => {
    const member = getFamilyMemberById('1');
    expect(member).toBeDefined();
    expect(member!.id).toBe('1');
  });

  it('debe retornar undefined para ID inexistente', () => {
    const member = getFamilyMemberById('999');
    expect(member).toBeUndefined();
  });

  it('debe encontrar un miembro por nombre (case insensitive)', () => {
    const members = getFamilyMembers();
    const firstName = members[0].nombre;
    const member = getFamilyMemberByName(firstName.toLowerCase());
    expect(member).toBeDefined();
    expect(member!.nombre).toBe(firstName);
  });

  it('debe retornar undefined para nombre inexistente', () => {
    const member = getFamilyMemberByName('NoExiste');
    expect(member).toBeUndefined();
  });
});
