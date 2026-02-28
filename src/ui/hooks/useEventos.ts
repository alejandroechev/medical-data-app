import { useState, useEffect, useCallback } from 'react';
import type { MedicalEvent, CreateMedicalEventInput, UpdateMedicalEventInput } from '../../domain/models/medical-event';
import type { MedicalEventFilters } from '../../domain/services/medical-event-repository';
import {
  crearEvento,
  listarEventos,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento,
} from '../../infra/store-provider';

export function useEventos(filtros?: MedicalEventFilters) {
  const [eventos, setEventos] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarEventos(filtros);
      setEventos(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filtros?.pacienteId, filtros?.tipo, filtros?.desde, filtros?.hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async (input: CreateMedicalEventInput) => {
    const evento = await crearEvento(input);
    await cargar();
    return evento;
  };

  const actualizar = async (id: string, input: UpdateMedicalEventInput) => {
    const evento = await actualizarEvento(id, input);
    await cargar();
    return evento;
  };

  const eliminar = async (id: string) => {
    await eliminarEvento(id);
    await cargar();
  };

  return { eventos, loading, error, cargar, crear, actualizar, eliminar };
}

export function useEvento(id: string | null) {
  const [evento, setEvento] = useState<MedicalEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    obtenerEventoPorId(id)
      .then(setEvento)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return { evento, loading, error };
}
