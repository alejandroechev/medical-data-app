import { v4 as uuidv4 } from 'uuid';
import type {
  MedicalEvent,
  CreateMedicalEventInput,
  UpdateMedicalEventInput,
} from '../../domain/models/medical-event.js';
import type { MedicalEventFilters } from '../../domain/services/medical-event-repository.js';

export class InMemoryMedicalEventStore {
  private events: Map<string, MedicalEvent> = new Map();

  async crear(input: CreateMedicalEventInput): Promise<MedicalEvent> {
    const now = new Date().toISOString();
    const evento: MedicalEvent = {
      id: uuidv4(),
      fecha: input.fecha,
      tipo: input.tipo,
      descripcion: input.descripcion,
      pacienteId: input.pacienteId,
      reembolsoIsapre: input.reembolsoIsapre ?? false,
      reembolsoSeguro: input.reembolsoSeguro ?? false,
      creadoEn: now,
      actualizadoEn: now,
    };
    this.events.set(evento.id, evento);
    return { ...evento };
  }

  async obtenerPorId(id: string): Promise<MedicalEvent | null> {
    const evento = this.events.get(id);
    return evento ? { ...evento } : null;
  }

  async listar(filtros?: MedicalEventFilters): Promise<MedicalEvent[]> {
    let results = Array.from(this.events.values());

    if (filtros?.pacienteId) {
      results = results.filter((e) => e.pacienteId === filtros.pacienteId);
    }
    if (filtros?.tipo) {
      results = results.filter((e) => e.tipo === filtros.tipo);
    }
    if (filtros?.desde) {
      results = results.filter((e) => e.fecha >= filtros.desde!);
    }
    if (filtros?.hasta) {
      results = results.filter((e) => e.fecha <= filtros.hasta!);
    }

    return results.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((e) => ({ ...e }));
  }

  async actualizar(id: string, input: UpdateMedicalEventInput): Promise<MedicalEvent> {
    const existing = this.events.get(id);
    if (!existing) throw new Error(`Evento ${id} no encontrado`);

    const updated: MedicalEvent = {
      ...existing,
      ...(input.fecha !== undefined && { fecha: input.fecha }),
      ...(input.tipo !== undefined && { tipo: input.tipo }),
      ...(input.descripcion !== undefined && { descripcion: input.descripcion }),
      ...(input.pacienteId !== undefined && { pacienteId: input.pacienteId }),
      ...(input.reembolsoIsapre !== undefined && { reembolsoIsapre: input.reembolsoIsapre }),
      ...(input.reembolsoSeguro !== undefined && { reembolsoSeguro: input.reembolsoSeguro }),
      actualizadoEn: new Date().toISOString(),
    };
    this.events.set(id, updated);
    return { ...updated };
  }

  async eliminar(id: string): Promise<void> {
    this.events.delete(id);
  }
}
