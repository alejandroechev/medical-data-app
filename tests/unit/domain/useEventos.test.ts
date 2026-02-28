import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEventos, useEvento } from '../../../src/ui/hooks/useEventos';

vi.mock('../../../src/infra/store-provider', () => ({
  listarEventos: vi.fn(),
  crearEvento: vi.fn(),
  obtenerEventoPorId: vi.fn(),
  actualizarEvento: vi.fn(),
  eliminarEvento: vi.fn(),
}));

import {
  listarEventos,
  crearEvento,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento,
} from '../../../src/infra/store-provider';

const mockListar = vi.mocked(listarEventos);
const mockCrear = vi.mocked(crearEvento);
const mockObtener = vi.mocked(obtenerEventoPorId);
const mockActualizar = vi.mocked(actualizarEvento);
const mockEliminar = vi.mocked(eliminarEvento);

const mockEvento = {
  id: '1',
  fecha: '2024-06-15',
  tipo: 'Consulta Médica' as const,
  descripcion: 'Control',
  pacienteId: '1',
  reembolsoIsapre: false,
  reembolsoSeguro: false,
  creadoEn: '2024-06-15T10:00:00Z',
  actualizadoEn: '2024-06-15T10:00:00Z',
};

describe('useEventos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe cargar eventos al iniciar', async () => {
    mockListar.mockResolvedValue([mockEvento]);
    const { result } = renderHook(() => useEventos());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.eventos).toEqual([mockEvento]);
    expect(result.current.error).toBeNull();
  });

  it('debe manejar error de carga', async () => {
    mockListar.mockRejectedValue(new Error('Error de red'));
    const { result } = renderHook(() => useEventos());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Error de red');
    expect(result.current.eventos).toEqual([]);
  });

  it('debe crear evento y recargar', async () => {
    mockListar.mockResolvedValue([]);
    mockCrear.mockResolvedValue(mockEvento);

    const { result } = renderHook(() => useEventos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockListar.mockResolvedValue([mockEvento]);
    await result.current.crear({
      fecha: '2024-06-15',
      tipo: 'Consulta Médica',
      descripcion: 'Control',
      pacienteId: '1',
    });

    await waitFor(() => expect(result.current.eventos).toHaveLength(1));
    expect(mockCrear).toHaveBeenCalledOnce();
  });

  it('debe actualizar evento y recargar', async () => {
    mockListar.mockResolvedValue([mockEvento]);
    const updated = { ...mockEvento, reembolsoIsapre: true };
    mockActualizar.mockResolvedValue(updated);

    const { result } = renderHook(() => useEventos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockListar.mockResolvedValue([updated]);
    await result.current.actualizar('1', { reembolsoIsapre: true });

    expect(mockActualizar).toHaveBeenCalledWith('1', { reembolsoIsapre: true });
  });

  it('debe eliminar evento y recargar', async () => {
    mockListar.mockResolvedValue([mockEvento]);
    mockEliminar.mockResolvedValue(undefined);

    const { result } = renderHook(() => useEventos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockListar.mockResolvedValue([]);
    await result.current.eliminar('1');

    expect(mockEliminar).toHaveBeenCalledWith('1');
    await waitFor(() => expect(result.current.eventos).toHaveLength(0));
  });

  it('debe pasar filtros a listarEventos', async () => {
    mockListar.mockResolvedValue([]);
    renderHook(() => useEventos({ pacienteId: '1', tipo: 'Urgencia' }));

    await waitFor(() =>
      expect(mockListar).toHaveBeenCalledWith({ pacienteId: '1', tipo: 'Urgencia', desde: undefined, hasta: undefined })
    );
  });
});

describe('useEvento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no debe cargar cuando id es null', () => {
    const { result } = renderHook(() => useEvento(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.evento).toBeNull();
  });

  it('debe cargar evento por id', async () => {
    mockObtener.mockResolvedValue(mockEvento);
    const { result } = renderHook(() => useEvento('1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.evento).toEqual(mockEvento);
  });

  it('debe manejar error de carga', async () => {
    mockObtener.mockRejectedValue(new Error('No encontrado'));
    const { result } = renderHook(() => useEvento('999'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('No encontrado');
  });
});
