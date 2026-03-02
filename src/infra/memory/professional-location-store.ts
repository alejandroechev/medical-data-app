import { v4 as uuidv4 } from 'uuid';
import type { Professional, Location } from '../../domain/models/professional-location.js';

export class InMemoryProfessionalStore {
  private professionals: Map<string, Professional> = new Map();

  async create(name: string, specialty?: string): Promise<Professional> {
    const professional: Professional = {
      id: uuidv4(),
      name,
      ...(specialty !== undefined && { specialty }),
      createdAt: new Date().toISOString(),
    };
    this.professionals.set(professional.id, professional);
    return { ...professional };
  }

  async list(): Promise<Professional[]> {
    return Array.from(this.professionals.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({ ...p }));
  }

  async getById(id: string): Promise<Professional | undefined> {
    const p = this.professionals.get(id);
    return p ? { ...p } : undefined;
  }
}

export class InMemoryLocationStore {
  private locations: Map<string, Location> = new Map();

  async create(name: string): Promise<Location> {
    const location: Location = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
    };
    this.locations.set(location.id, location);
    return { ...location };
  }

  async list(): Promise<Location[]> {
    return Array.from(this.locations.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((l) => ({ ...l }));
  }

  async getById(id: string): Promise<Location | undefined> {
    const l = this.locations.get(id);
    return l ? { ...l } : undefined;
  }
}
