import { describe, it, expect } from 'vitest';
import {
  validarCrearEvento,
  validarActualizarEvento,
} from '../../../src/domain/validators/medical-event-validator';
import { CreateMedicalEventInput, UpdateMedicalEventInput } from '../../../src/domain/models/medical-event';

describe('validarCrearEvento', () => {
  const inputValido: CreateMedicalEventInput = {
    fecha: '2024-06-15',
    tipo: 'Consulta Médica',
    descripcion: 'Control anual con médico general',
    pacienteId: 'abc-123',
  };

  it('debe validar correctamente un input completo y válido', () => {
    const resultado = validarCrearEvento(inputValido);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('debe rechazar fecha vacía', () => {
    const resultado = validarCrearEvento({ ...inputValido, fecha: '' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'fecha' })
    );
  });

  it('debe rechazar fecha con formato inválido', () => {
    const resultado = validarCrearEvento({ ...inputValido, fecha: '15-06-2024' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'fecha', mensaje: expect.stringContaining('YYYY-MM-DD') })
    );
  });

  it('debe rechazar fecha imposible', () => {
    const resultado = validarCrearEvento({ ...inputValido, fecha: '2024-13-45' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'fecha' })
    );
  });

  it('debe rechazar tipo vacío', () => {
    const resultado = validarCrearEvento({ ...inputValido, tipo: '' as any });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'tipo' })
    );
  });

  it('debe rechazar tipo inválido', () => {
    const resultado = validarCrearEvento({ ...inputValido, tipo: 'Fisioterapia' as any });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'tipo', mensaje: expect.stringContaining('Tipo inválido') })
    );
  });

  it('debe rechazar descripción vacía', () => {
    const resultado = validarCrearEvento({ ...inputValido, descripcion: '' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'descripcion' })
    );
  });

  it('debe rechazar pacienteId vacío', () => {
    const resultado = validarCrearEvento({ ...inputValido, pacienteId: '' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'pacienteId' })
    );
  });

  it('debe reportar múltiples errores simultáneamente', () => {
    const resultado = validarCrearEvento({
      fecha: '',
      tipo: '' as any,
      descripcion: '',
      pacienteId: '',
    });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.length).toBeGreaterThanOrEqual(4);
  });

  it('debe aceptar reembolso flags opcionales', () => {
    const resultado = validarCrearEvento({
      ...inputValido,
      reembolsoIsapre: true,
      reembolsoSeguro: false,
    });
    expect(resultado.valido).toBe(true);
  });
});

describe('validarActualizarEvento', () => {
  it('debe validar correctamente un input vacío (sin cambios)', () => {
    const resultado = validarActualizarEvento({});
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('debe validar una fecha válida parcial', () => {
    const resultado = validarActualizarEvento({ fecha: '2024-08-20' });
    expect(resultado.valido).toBe(true);
  });

  it('debe rechazar fecha vacía en actualización', () => {
    const resultado = validarActualizarEvento({ fecha: '' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'fecha' })
    );
  });

  it('debe rechazar tipo inválido en actualización', () => {
    const resultado = validarActualizarEvento({ tipo: 'Inventado' as any });
    expect(resultado.valido).toBe(false);
  });

  it('debe rechazar descripción vacía en actualización', () => {
    const resultado = validarActualizarEvento({ descripcion: '   ' });
    expect(resultado.valido).toBe(false);
  });

  it('debe aceptar actualización de solo reembolso', () => {
    const resultado = validarActualizarEvento({ reembolsoIsapre: true });
    expect(resultado.valido).toBe(true);
  });
});
