import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPickupAlerts } from '../../../src/domain/services/pickup-notification-checker';
import type { PatientDrug } from '../../../src/domain/models/prescription-drug';

// Re-test the checker from a CLI perspective — verifying console output format
describe('CLI notifications output', () => {
  function makeDrug(overrides: Partial<PatientDrug> = {}): PatientDrug {
    return {
      id: 'drug-1',
      patientId: 'p1',
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

  it('formats alerts for CLI output', () => {
    const drugs = [
      makeDrug({ id: 'a', name: 'Atorvastatina', nextPickupDate: '2025-03-18' }),
      makeDrug({ id: 'b', name: 'Losartán', nextPickupDate: '2025-03-15' }),
    ];
    const alerts = checkPickupAlerts(drugs, new Date('2025-03-15'));
    expect(alerts).toHaveLength(2);

    const lines = alerts.map((a) => {
      if (a.level === 'reminder') return `📋 En ${a.daysUntilPickup} día(s): ${a.drugName}`;
      if (a.level === 'due') return `⚠️  Hoy: ${a.drugName}`;
      return `🔴 Atrasado: ${a.drugName}`;
    });
    expect(lines[0]).toContain('En 3 día(s)');
    expect(lines[1]).toContain('Hoy');
  });
});
