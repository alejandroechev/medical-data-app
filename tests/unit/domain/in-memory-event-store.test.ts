import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryMedicalEventStore } from '../../../src/infra/memory/medical-event-store';

describe('InMemoryMedicalEventStore', () => {
  let store: InMemoryMedicalEventStore;

  beforeEach(() => {
    store = new InMemoryMedicalEventStore();
  });

  it('should create an event and return it with generated ID', async () => {
    const event = await store.create({
      date: '2024-06-15',
      type: 'Consulta Médica',
      description: 'Control anual',
      patientId: '1',
    });
    expect(event.id).toBeDefined();
    expect(event.date).toBe('2024-06-15');
    expect(event.type).toBe('Consulta Médica');
    expect(event.description).toBe('Control anual');
    expect(event.patientId).toBe('1');
    expect(event.isapreReimbursed).toBe(false);
    expect(event.insuranceReimbursed).toBe(false);
  });

  it('should get an event by ID', async () => {
    const created = await store.create({
      date: '2024-06-15',
      type: 'Urgencia',
      description: 'Dolor fuerte',
      patientId: '2',
    });
    const found = await store.getById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
  });

  it('should return null for non-existent ID', async () => {
    const found = await store.getById('no-existe');
    expect(found).toBeNull();
  });

  it('should list events sorted by date descending', async () => {
    await store.create({ date: '2024-01-01', type: 'Examen', description: 'Sangre', patientId: '1' });
    await store.create({ date: '2024-06-15', type: 'Urgencia', description: 'ER', patientId: '1' });
    await store.create({ date: '2024-03-10', type: 'Consulta Dental', description: 'Limpieza', patientId: '2' });

    const events = await store.list();
    expect(events).toHaveLength(3);
    expect(events[0].date).toBe('2024-06-15');
    expect(events[2].date).toBe('2024-01-01');
  });

  it('should filter by patientId', async () => {
    await store.create({ date: '2024-01-01', type: 'Examen', description: 'A', patientId: '1' });
    await store.create({ date: '2024-02-01', type: 'Examen', description: 'B', patientId: '2' });

    const filtered = await store.list({ patientId: '1' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].patientId).toBe('1');
  });

  it('should filter by type', async () => {
    await store.create({ date: '2024-01-01', type: 'Examen', description: 'A', patientId: '1' });
    await store.create({ date: '2024-02-01', type: 'Urgencia', description: 'B', patientId: '1' });

    const filtered = await store.list({ type: 'Urgencia' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe('Urgencia');
  });

  it('should filter by date range', async () => {
    await store.create({ date: '2024-01-01', type: 'Examen', description: 'A', patientId: '1' });
    await store.create({ date: '2024-06-15', type: 'Examen', description: 'B', patientId: '1' });
    await store.create({ date: '2024-12-01', type: 'Examen', description: 'C', patientId: '1' });

    const filtered = await store.list({ from: '2024-03-01', to: '2024-09-01' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe('2024-06-15');
  });

  it('should update an event', async () => {
    const created = await store.create({ date: '2024-01-01', type: 'Examen', description: 'Original', patientId: '1' });
    const updated = await store.update(created.id, { description: 'Modificado', isapreReimbursed: true });

    expect(updated.description).toBe('Modificado');
    expect(updated.isapreReimbursed).toBe(true);
    expect(updated.date).toBe('2024-01-01'); // unchanged fields preserved
  });

  it('should delete an event', async () => {
    const created = await store.create({ date: '2024-01-01', type: 'Examen', description: 'A', patientId: '1' });
    await store.delete(created.id);
    const found = await store.getById(created.id);
    expect(found).toBeNull();
  });

  it('should filter by isapreReimbursed', async () => {
    await store.create({ date: '2024-01-01', type: 'Examen', description: 'A', patientId: '1', isapreReimbursed: true });
    await store.create({ date: '2024-02-01', type: 'Examen', description: 'B', patientId: '1', isapreReimbursed: false });

    const filtered = await store.list({ isapreReimbursed: true });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].isapreReimbursed).toBe(true);
  });

  it('should filter by insuranceReimbursed', async () => {
    await store.create({ date: '2024-01-01', type: 'Examen', description: 'A', patientId: '1', insuranceReimbursed: true });
    await store.create({ date: '2024-02-01', type: 'Examen', description: 'B', patientId: '1', insuranceReimbursed: false });

    const filtered = await store.list({ insuranceReimbursed: true });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].insuranceReimbursed).toBe(true);
  });
});
