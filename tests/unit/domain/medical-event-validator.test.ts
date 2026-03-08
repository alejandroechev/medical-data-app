import { describe, it, expect } from 'vitest';
import {
  validateCreateEvent,
  validateUpdateEvent,
} from '../../../src/domain/validators/medical-event-validator';
import { CreateMedicalEventInput, UpdateMedicalEventInput } from '../../../src/domain/models/medical-event';

describe('validateCreateEvent', () => {
  const validInput: CreateMedicalEventInput = {
    date: '2024-06-15',
    type: 'Consulta Médica',
    description: 'Control anual con médico general',
    patientId: 'abc-123',
  };

  it('should validate a complete and valid input', () => {
    const result = validateCreateEvent(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty date', () => {
    const result = validateCreateEvent({ ...validInput, date: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'date' })
    );
  });

  it('should reject date with invalid format', () => {
    const result = validateCreateEvent({ ...validInput, date: '15-06-2024' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'date', message: expect.stringContaining('YYYY-MM-DD') })
    );
  });

  it('should reject impossible date', () => {
    const result = validateCreateEvent({ ...validInput, date: '2024-13-45' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'date' })
    );
  });

  it('should reject empty type', () => {
    const result = validateCreateEvent({ ...validInput, type: '' as any });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'type' })
    );
  });

  it('should reject invalid type', () => {
    const result = validateCreateEvent({ ...validInput, type: 'Fisioterapia' as any });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'type', message: expect.stringContaining('Tipo inválido') })
    );
  });

  it('should reject empty description', () => {
    const result = validateCreateEvent({ ...validInput, description: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'description' })
    );
  });

  it('should reject empty patientId', () => {
    const result = validateCreateEvent({ ...validInput, patientId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'patientId' })
    );
  });

  it('should report multiple errors simultaneously', () => {
    const result = validateCreateEvent({
      date: '',
      type: '' as any,
      description: '',
      patientId: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('should accept optional reimbursement status', () => {
    const result = validateCreateEvent({
      ...validInput,
      isapreReimbursementStatus: 'requested',
      insuranceReimbursementStatus: 'none',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject invalid reimbursement status', () => {
    const result = validateCreateEvent({
      ...validInput,
      isapreReimbursementStatus: 'invalid' as any,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'isapreReimbursementStatus' })
    );
  });

  it('should accept Receta without parentEventId', () => {
    const result = validateCreateEvent({
      ...validInput,
      type: 'Receta',
    });
    expect(result.valid).toBe(true);
  });

  it('should accept Receta with parentEventId', () => {
    const result = validateCreateEvent({
      ...validInput,
      type: 'Receta',
      parentEventId: 'parent-123',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateUpdateEvent', () => {
  it('should validate an empty input (no changes)', () => {
    const result = validateUpdateEvent({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid partial date', () => {
    const result = validateUpdateEvent({ date: '2024-08-20' });
    expect(result.valid).toBe(true);
  });

  it('should reject empty date in update', () => {
    const result = validateUpdateEvent({ date: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'date' })
    );
  });

  it('should reject invalid type in update', () => {
    const result = validateUpdateEvent({ type: 'Inventado' as any });
    expect(result.valid).toBe(false);
  });

  it('should reject empty description in update', () => {
    const result = validateUpdateEvent({ description: '   ' });
    expect(result.valid).toBe(false);
  });

  it('should accept update of reimbursement status only', () => {
    const result = validateUpdateEvent({ isapreReimbursementStatus: 'approved' });
    expect(result.valid).toBe(true);
  });

  it('should reject invalid reimbursement status in update', () => {
    const result = validateUpdateEvent({ insuranceReimbursementStatus: 'bogus' as any });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'insuranceReimbursementStatus' })
    );
  });
});
