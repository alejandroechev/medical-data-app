import { describe, it, expect } from 'vitest';
import { createFamilyMember } from '../../../src/domain/models/family-member';

describe('FamilyMember', () => {
  it('debe crear un miembro de familia con los campos correctos', () => {
    const member = createFamilyMember('1', 'Juan Pérez', 'Padre');
    expect(member).toEqual({
      id: '1',
      nombre: 'Juan Pérez',
      parentesco: 'Padre',
    });
  });

  it('debe preservar todos los caracteres especiales en el nombre', () => {
    const member = createFamilyMember('2', 'María José García', 'Madre');
    expect(member.nombre).toBe('María José García');
  });
});
