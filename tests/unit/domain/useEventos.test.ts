import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents, useEvent } from '../../../src/ui/hooks/useEventos';

vi.mock('../../../src/infra/store-provider', () => ({
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

import {
  listEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../../../src/infra/store-provider';

const mockList = vi.mocked(listEvents);
const mockCreate = vi.mocked(createEvent);
const mockGetById = vi.mocked(getEventById);
const mockUpdate = vi.mocked(updateEvent);
const mockDelete = vi.mocked(deleteEvent);

const mockEvent = {
  id: '1',
  date: '2024-06-15',
  type: 'Consulta Médica' as const,
  description: 'Control',
  patientId: '1',
  isapreReimbursed: false,
  insuranceReimbursed: false,
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: '2024-06-15T10:00:00Z',
};

describe('useEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load events on init', async () => {
    mockList.mockResolvedValue([mockEvent]);
    const { result } = renderHook(() => useEvents());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([mockEvent]);
    expect(result.current.error).toBeNull();
  });

  it('should handle load error', async () => {
    mockList.mockRejectedValue(new Error('Error de red'));
    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Error de red');
    expect(result.current.events).toEqual([]);
  });

  it('should create event and reload', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue(mockEvent);

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockList.mockResolvedValue([mockEvent]);
    await result.current.create({
      date: '2024-06-15',
      type: 'Consulta Médica',
      description: 'Control',
      patientId: '1',
    });

    await waitFor(() => expect(result.current.events).toHaveLength(1));
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('should update event and reload', async () => {
    mockList.mockResolvedValue([mockEvent]);
    const updated = { ...mockEvent, isapreReimbursed: true };
    mockUpdate.mockResolvedValue(updated);

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockList.mockResolvedValue([updated]);
    await result.current.update('1', { isapreReimbursed: true });

    expect(mockUpdate).toHaveBeenCalledWith('1', { isapreReimbursed: true });
  });

  it('should remove event and reload', async () => {
    mockList.mockResolvedValue([mockEvent]);
    mockDelete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockList.mockResolvedValue([]);
    await result.current.remove('1');

    expect(mockDelete).toHaveBeenCalledWith('1');
    await waitFor(() => expect(result.current.events).toHaveLength(0));
  });

  it('should pass filters to listEvents', async () => {
    mockList.mockResolvedValue([]);
    renderHook(() => useEvents({ patientId: '1', type: 'Urgencia' }));

    await waitFor(() =>
      expect(mockList).toHaveBeenCalledWith({ patientId: '1', type: 'Urgencia', from: undefined, to: undefined })
    );
  });
});

describe('useEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not load when id is null', () => {
    const { result } = renderHook(() => useEvent(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.event).toBeNull();
  });

  it('should load event by id', async () => {
    mockGetById.mockResolvedValue(mockEvent);
    const { result } = renderHook(() => useEvent('1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.event).toEqual(mockEvent);
  });

  it('should handle load error', async () => {
    mockGetById.mockRejectedValue(new Error('No encontrado'));
    const { result } = renderHook(() => useEvent('999'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('No encontrado');
  });
});
