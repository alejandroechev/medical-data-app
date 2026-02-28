import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InicioPage } from '../../../src/ui/pages/InicioPage';

// Mock the store provider
vi.mock('../../../src/infra/store-provider', () => ({
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

import { listEvents } from '../../../src/infra/store-provider';

const mockList = vi.mocked(listEvents);

describe('InicioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading message', () => {
    mockList.mockReturnValue(new Promise(() => {})); // never resolves
    render(<InicioPage onEventClick={() => {}} />);
    expect(screen.getByText('Cargando eventos...')).toBeInTheDocument();
  });

  it('should show empty state when there are no events', async () => {
    mockList.mockResolvedValue([]);
    render(<InicioPage onEventClick={() => {}} />);
    expect(await screen.findByText('Sin eventos médicos')).toBeInTheDocument();
  });

  it('should show events when they exist', async () => {
    mockList.mockResolvedValue([
      {
        id: '1',
        date: '2024-06-15',
        type: 'Consulta Médica' as const,
        description: 'Control anual',
        patientId: '1',
        isapreReimbursed: false,
        insuranceReimbursed: false,
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
      },
    ]);
    render(<InicioPage onEventClick={() => {}} />);
    expect(await screen.findByText('Control anual')).toBeInTheDocument();
    expect(screen.getByText('Eventos recientes')).toBeInTheDocument();
  });

  it('should show error when load fails', async () => {
    mockList.mockRejectedValue(new Error('Conexión fallida'));
    render(<InicioPage onEventClick={() => {}} />);
    expect(await screen.findByText('Error: Conexión fallida')).toBeInTheDocument();
  });
});
