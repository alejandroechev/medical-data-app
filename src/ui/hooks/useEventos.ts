import { useState, useEffect, useCallback } from 'react';
import type { MedicalEvent, CreateMedicalEventInput, UpdateMedicalEventInput } from '../../domain/models/medical-event';
import type { MedicalEventFilters } from '../../domain/services/medical-event-repository';
import {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../../infra/store-provider';

export function useEvents(filters?: MedicalEventFilters) {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listEvents(filters);
      setEvents(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters?.patientId, filters?.type, filters?.from, filters?.to, filters?.isapreReimbursed, filters?.insuranceReimbursed]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: CreateMedicalEventInput) => {
    const event = await createEvent(input);
    await load();
    return event;
  };

  const update = async (id: string, input: UpdateMedicalEventInput) => {
    const event = await updateEvent(id, input);
    await load();
    return event;
  };

  const remove = async (id: string) => {
    await deleteEvent(id);
    await load();
  };

  return { events, loading, error, load, create, update, remove };
}

export function useEvent(id: string | null) {
  const [event, setEvent] = useState<MedicalEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getEventById(id)
      .then(setEvent)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return { event, loading, error };
}
