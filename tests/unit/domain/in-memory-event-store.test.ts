import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryMedicalEventStore } from '../../../src/infra/memory/medical-event-store';

describe('InMemoryMedicalEventStore', () => {
  let store: InMemoryMedicalEventStore;

  beforeEach(() => {
    store = new InMemoryMedicalEventStore();
  });

  it('debe crear un evento y retornarlo con ID generado', async () => {
    const evento = await store.crear({
      fecha: '2024-06-15',
      tipo: 'Consulta Médica',
      descripcion: 'Control anual',
      pacienteId: '1',
    });
    expect(evento.id).toBeDefined();
    expect(evento.fecha).toBe('2024-06-15');
    expect(evento.tipo).toBe('Consulta Médica');
    expect(evento.descripcion).toBe('Control anual');
    expect(evento.pacienteId).toBe('1');
    expect(evento.reembolsoIsapre).toBe(false);
    expect(evento.reembolsoSeguro).toBe(false);
  });

  it('debe obtener un evento por ID', async () => {
    const created = await store.crear({
      fecha: '2024-06-15',
      tipo: 'Urgencia',
      descripcion: 'Dolor fuerte',
      pacienteId: '2',
    });
    const found = await store.obtenerPorId(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
  });

  it('debe retornar null para ID inexistente', async () => {
    const found = await store.obtenerPorId('no-existe');
    expect(found).toBeNull();
  });

  it('debe listar eventos ordenados por fecha descendente', async () => {
    await store.crear({ fecha: '2024-01-01', tipo: 'Examen', descripcion: 'Sangre', pacienteId: '1' });
    await store.crear({ fecha: '2024-06-15', tipo: 'Urgencia', descripcion: 'ER', pacienteId: '1' });
    await store.crear({ fecha: '2024-03-10', tipo: 'Consulta Dental', descripcion: 'Limpieza', pacienteId: '2' });

    const eventos = await store.listar();
    expect(eventos).toHaveLength(3);
    expect(eventos[0].fecha).toBe('2024-06-15');
    expect(eventos[2].fecha).toBe('2024-01-01');
  });

  it('debe filtrar por pacienteId', async () => {
    await store.crear({ fecha: '2024-01-01', tipo: 'Examen', descripcion: 'A', pacienteId: '1' });
    await store.crear({ fecha: '2024-02-01', tipo: 'Examen', descripcion: 'B', pacienteId: '2' });

    const filtered = await store.listar({ pacienteId: '1' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].pacienteId).toBe('1');
  });

  it('debe filtrar por tipo', async () => {
    await store.crear({ fecha: '2024-01-01', tipo: 'Examen', descripcion: 'A', pacienteId: '1' });
    await store.crear({ fecha: '2024-02-01', tipo: 'Urgencia', descripcion: 'B', pacienteId: '1' });

    const filtered = await store.listar({ tipo: 'Urgencia' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].tipo).toBe('Urgencia');
  });

  it('debe filtrar por rango de fechas', async () => {
    await store.crear({ fecha: '2024-01-01', tipo: 'Examen', descripcion: 'A', pacienteId: '1' });
    await store.crear({ fecha: '2024-06-15', tipo: 'Examen', descripcion: 'B', pacienteId: '1' });
    await store.crear({ fecha: '2024-12-01', tipo: 'Examen', descripcion: 'C', pacienteId: '1' });

    const filtered = await store.listar({ desde: '2024-03-01', hasta: '2024-09-01' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].fecha).toBe('2024-06-15');
  });

  it('debe actualizar un evento', async () => {
    const created = await store.crear({ fecha: '2024-01-01', tipo: 'Examen', descripcion: 'Original', pacienteId: '1' });
    const updated = await store.actualizar(created.id, { descripcion: 'Modificado', reembolsoIsapre: true });

    expect(updated.descripcion).toBe('Modificado');
    expect(updated.reembolsoIsapre).toBe(true);
    expect(updated.fecha).toBe('2024-01-01'); // unchanged fields preserved
  });

  it('debe eliminar un evento', async () => {
    const created = await store.crear({ fecha: '2024-01-01', tipo: 'Examen', descripcion: 'A', pacienteId: '1' });
    await store.eliminar(created.id);
    const found = await store.obtenerPorId(created.id);
    expect(found).toBeNull();
  });
});
