import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPrescriptionDrugStore } from '../../../src/infra/memory/prescription-drug-store';

describe('InMemoryPrescriptionDrugStore', () => {
  let store: InMemoryPrescriptionDrugStore;

  beforeEach(() => {
    store = new InMemoryPrescriptionDrugStore();
  });

  it('should create a drug and return it with generated ID', async () => {
    const drug = await store.create({
      eventId: 'event-1',
      name: 'Amoxicilina',
      dosage: '500mg',
      frequency: 'cada 8 horas',
      durationDays: 7,
    });
    expect(drug.id).toBeDefined();
    expect(drug.name).toBe('Amoxicilina');
    expect(drug.dosage).toBe('500mg');
    expect(drug.frequency).toBe('cada 8 horas');
    expect(drug.durationDays).toBe(7);
    expect(drug.eventId).toBe('event-1');
  });

  it('should list drugs by event', async () => {
    await store.create({ eventId: 'event-1', name: 'Drug A', dosage: '10mg', frequency: 'diario' });
    await store.create({ eventId: 'event-1', name: 'Drug B', dosage: '20mg', frequency: 'cada 12h' });
    await store.create({ eventId: 'event-2', name: 'Drug C', dosage: '5mg', frequency: 'diario' });

    const drugs = await store.listByEvent('event-1');
    expect(drugs).toHaveLength(2);
    expect(drugs.map((d) => d.name)).toEqual(['Drug A', 'Drug B']);
  });

  it('should return empty list for event with no drugs', async () => {
    const drugs = await store.listByEvent('no-existe');
    expect(drugs).toEqual([]);
  });

  it('should delete a drug', async () => {
    const drug = await store.create({ eventId: 'event-1', name: 'Drug A', dosage: '10mg', frequency: 'diario' });
    await store.delete(drug.id);
    const drugs = await store.listByEvent('event-1');
    expect(drugs).toHaveLength(0);
  });

  it('should create drug without durationDays', async () => {
    const drug = await store.create({
      eventId: 'event-1',
      name: 'Ibuprofeno',
      dosage: '400mg',
      frequency: 'según dolor',
    });
    expect(drug.durationDays).toBeUndefined();
  });
});
