import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistorialPage } from '../../../src/ui/pages/HistorialPage';

vi.mock('../../../src/infra/store-provider', () => ({
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

import { listEvents } from '../../../src/infra/store-provider';

const mockList = vi.mocked(listEvents);

describe('HistorialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the filters', () => {
    mockList.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(screen.getByLabelText('Paciente')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
  });

  it('should show message when there are no results', async () => {
    mockList.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(
      await screen.findByText('No se encontraron eventos con los filtros seleccionados')
    ).toBeInTheDocument();
  });

  it('should show event count', async () => {
    mockList.mockResolvedValue([
      {
        id: '1',
        date: '2024-06-15',
        type: 'Consulta Médica' as const,
        description: 'Control',
        patientId: '1',
        isapreReimbursed: false,
        insuranceReimbursed: false,
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
      },
    ]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(await screen.findByText('1 evento encontrado')).toBeInTheDocument();
  });

  it('should show error when load fails', async () => {
    mockList.mockRejectedValue(new Error('Sin conexión'));
    render(<HistorialPage onEventClick={() => {}} />);
    expect(await screen.findByText('Error: Sin conexión')).toBeInTheDocument();
  });

  it('should have "Todos" option in filter selects', () => {
    mockList.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);

    const pacienteSelect = screen.getByLabelText('Paciente');
    const tipoSelect = screen.getByLabelText('Tipo');

    expect(pacienteSelect.querySelector('option[value=""]')).toBeTruthy();
    expect(tipoSelect.querySelector('option[value=""]')).toBeTruthy();
  });
});
