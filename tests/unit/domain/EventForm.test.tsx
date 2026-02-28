import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../../../src/ui/components/EventForm';

describe('EventForm', () => {
  let mockSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSubmit = vi.fn().mockResolvedValue(undefined);
  });

  it('should render all form fields', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de evento')).toBeInTheDocument();
    expect(screen.getByLabelText('Paciente')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText('Reembolsado por ISAPRE')).toBeInTheDocument();
    expect(screen.getByLabelText('Reembolsado por Seguro Complementario')).toBeInTheDocument();
  });

  it('should render the save button', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    expect(screen.getByRole('button', { name: 'Guardar Evento' })).toBeInTheDocument();
  });

  it('should show validation errors with empty description', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockSubmit} />);

    // Submit with empty description
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));
    expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with valid input', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('Descripción'), 'Control anual');
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(mockSubmit).toHaveBeenCalledOnce();
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Control anual',
        type: 'Consulta Médica',
        isapreReimbursed: false,
        insuranceReimbursed: false,
      })
    );
  });

  it('should allow checking reimbursement checkboxes', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('Descripción'), 'Test');
    await user.click(screen.getByLabelText('Reembolsado por ISAPRE'));
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        isapreReimbursed: true,
        insuranceReimbursed: false,
      })
    );
  });

  it('should show Guardando... when loading is true', () => {
    render(<EventForm onSubmit={mockSubmit} loading={true} />);
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
  });

  it('should clear description after successful submit', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockSubmit} />);

    const descInput = screen.getByLabelText('Descripción');
    await user.type(descInput, 'Control anual');
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(descInput).toHaveValue('');
  });

  it('should show error if onSubmit throws', async () => {
    const user = userEvent.setup();
    const failingSubmit = vi.fn().mockRejectedValue(new Error('Falló la conexión'));
    render(<EventForm onSubmit={failingSubmit} />);

    await user.type(screen.getByLabelText('Descripción'), 'Test');
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(screen.getByText('Falló la conexión')).toBeInTheDocument();
  });

  it('should render all event types in the select', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    const select = screen.getByLabelText('Tipo de evento');
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll('option');
    expect(options.length).toBe(6);
  });

  it('should render all family members in the select', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    const select = screen.getByLabelText('Paciente');
    const options = select.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(0);
  });
});
