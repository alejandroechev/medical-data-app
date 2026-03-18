import { describe, it, expect } from 'vitest';
import { checkPickupAlerts } from '../../../src/domain/services/pickup-notification-checker';
import type { PatientDrug } from '../../../src/domain/models/prescription-drug';

function makeDrug(overrides: Partial<PatientDrug> = {}): PatientDrug {
  return {
    id: 'drug-1',
    patientId: 'patient-1',
    name: 'Atorvastatina',
    dosage: '20mg',
    schedule: { type: 'fixed', times: ['08:00'] },
    duration: { type: 'indefinite' },
    startDate: '2024-01-01',
    isPermanent: true,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('checkPickupAlerts', () => {
  it('returns empty array when no drugs have nextPickupDate', () => {
    const drugs = [makeDrug({ nextPickupDate: undefined })];
    const result = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(result).toEqual([]);
  });

  it('returns empty array for empty drug list', () => {
    const result = checkPickupAlerts([], new Date('2025-03-15'));
    expect(result).toEqual([]);
  });

  it('returns reminder alert 3 days before pickup date', () => {
    const drugs = [makeDrug({ nextPickupDate: '2025-03-18' })];
    const result = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      drugId: 'drug-1',
      drugName: 'Atorvastatina',
      patientId: 'patient-1',
      nextPickupDate: '2025-03-18',
      level: 'reminder',
      daysUntilPickup: 3,
    });
  });

  it('returns due alert on the pickup date', () => {
    const drugs = [makeDrug({ nextPickupDate: '2025-03-15' })];
    const result = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      level: 'due',
      daysUntilPickup: 0,
    });
  });

  it('returns overdue alert 1 day after pickup date', () => {
    const drugs = [makeDrug({ nextPickupDate: '2025-03-14' })];
    const result = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      level: 'overdue',
      daysUntilPickup: -1,
    });
  });

  it('returns no alert when pickup is 4+ days away', () => {
    const drugs = [makeDrug({ nextPickupDate: '2025-03-20' })];
    const result = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(result).toEqual([]);
  });

  it('returns no alert when pickup was 2+ days ago', () => {
    const drugs = [makeDrug({ nextPickupDate: '2025-03-13' })];
    const result = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(result).toEqual([]);
  });

  it('skips inactive drugs', () => {
    const drugs = [makeDrug({ nextPickupDate: '2025-03-15', status: 'stopped' })];
    const result = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(result).toEqual([]);
  });

  it('handles multiple drugs with different alert levels', () => {
    const drugs = [
      makeDrug({ id: 'a', name: 'DrugA', nextPickupDate: '2025-03-18' }),
      makeDrug({ id: 'b', name: 'DrugB', nextPickupDate: '2025-03-15' }),
      makeDrug({ id: 'c', name: 'DrugC', nextPickupDate: '2025-03-14' }),
      makeDrug({ id: 'd', name: 'DrugD', nextPickupDate: '2025-03-25' }), // too far
    ];
    const result = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(result).toHaveLength(3);
    expect(result.map((a) => a.level)).toEqual(['reminder', 'due', 'overdue']);
  });

  it('returns reminder for days 1 and 2 before pickup as well', () => {
    const drugs1 = [makeDrug({ nextPickupDate: '2025-03-17' })];
    const result1 = checkPickupAlerts(drugs1, new Date('2025-03-15'));
    expect(result1).toHaveLength(1);
    expect(result1[0].level).toBe('reminder');
    expect(result1[0].daysUntilPickup).toBe(2);

    const drugs2 = [makeDrug({ nextPickupDate: '2025-03-16' })];
    const result2 = checkPickupAlerts(drugs2, new Date('2025-03-15'));
    expect(result2).toHaveLength(1);
    expect(result2[0].level).toBe('reminder');
    expect(result2[0].daysUntilPickup).toBe(1);
  });
});
