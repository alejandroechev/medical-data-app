import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePickupAlerts } from '../../../src/ui/hooks/usePickupAlerts';
import * as storeProvider from '../../../src/infra/store-provider';
import type { PatientDrug } from '../../../src/domain/models/prescription-drug';

vi.mock('../../../src/infra/store-provider', () => ({
  listAllPatientDrugs: vi.fn(),
}));

vi.mock('../../../src/infra/supabase/family-member-store', () => ({
  getFamilyMembers: () => [
    { id: 'p1', name: 'Alejandro', relationship: 'Padre' },
    { id: 'p2', name: 'Daniela', relationship: 'Madre' },
  ],
}));

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
    nextPickupDate: '2025-03-18',
    ...overrides,
  };
}

describe('usePickupAlerts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns alerts for drugs with upcoming pickup dates', async () => {
    vi.mocked(storeProvider.listAllPatientDrugs).mockResolvedValue([
      makeDrug({ nextPickupDate: '2025-03-18' }),
    ]);

    const { result } = renderHook(() => usePickupAlerts(new Date('2025-03-15')));

    await waitFor(() => {
      expect(result.current.alerts).toHaveLength(1);
    });

    expect(result.current.alerts[0].level).toBe('reminder');
    expect(result.current.patientNames.get('p1')).toBe('Alejandro');
  });

  it('returns empty alerts when no drugs have upcoming pickups', async () => {
    vi.mocked(storeProvider.listAllPatientDrugs).mockResolvedValue([
      makeDrug({ nextPickupDate: '2025-04-01' }),
    ]);

    const { result } = renderHook(() => usePickupAlerts(new Date('2025-03-15')));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.alerts).toHaveLength(0);
  });

  it('filters out dismissed alerts', async () => {
    localStorage.setItem(
      'medapp:notification:dismissed',
      JSON.stringify(['drug-1:2025-03-18:reminder'])
    );

    vi.mocked(storeProvider.listAllPatientDrugs).mockResolvedValue([
      makeDrug({ nextPickupDate: '2025-03-18' }),
    ]);

    const { result } = renderHook(() => usePickupAlerts(new Date('2025-03-15')));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.visibleAlerts).toHaveLength(0);
  });

  it('provides a dismiss function that hides the alert', async () => {
    vi.mocked(storeProvider.listAllPatientDrugs).mockResolvedValue([
      makeDrug({ nextPickupDate: '2025-03-18' }),
    ]);

    const { result } = renderHook(() => usePickupAlerts(new Date('2025-03-15')));

    await waitFor(() => {
      expect(result.current.visibleAlerts).toHaveLength(1);
    });

    result.current.dismissAlert('drug-1:2025-03-18:reminder');

    await waitFor(() => {
      expect(result.current.visibleAlerts).toHaveLength(0);
    });
  });
});
