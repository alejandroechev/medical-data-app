import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuevoEventoPage } from '../../../src/ui/pages/NuevoEventoPage';

vi.mock('../../../src/infra/store-provider', () => ({
  createEvent: vi.fn(),
  listEvents: vi.fn(),
  getEventById: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

import { createEvent } from '../../../src/infra/store-provider';

const mockCreate = vi.mocked(createEvent);

describe('NuevoEventoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the event form', () => {
    render(<NuevoEventoPage onCreated={() => {}} />);
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar Evento' })).toBeInTheDocument();
  });

  it('should show success message when event is created', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({
      id: 'new-1',
      date: '2024-06-15',
      type: 'Consulta Médica',
      description: 'Test',
      patientId: '1',
      isapreReimbursed: false,
      insuranceReimbursed: false,
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    });

    render(<NuevoEventoPage onCreated={() => {}} />);
    await user.type(screen.getByLabelText('Descripción'), 'Test evento');
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(await screen.findByText('✓ Evento creado exitosamente')).toBeInTheDocument();
  });
});
