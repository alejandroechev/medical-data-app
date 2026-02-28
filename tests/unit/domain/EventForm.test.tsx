import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../../../src/ui/components/EventForm';

describe('EventForm', () => {
  let mockSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSubmit = vi.fn().mockResolvedValue(undefined);
  });

  it('debe renderizar todos los campos del formulario', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de evento')).toBeInTheDocument();
    expect(screen.getByLabelText('Paciente')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText('Reembolsado por ISAPRE')).toBeInTheDocument();
    expect(screen.getByLabelText('Reembolsado por Seguro Complementario')).toBeInTheDocument();
  });

  it('debe renderizar el botón de guardar', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    expect(screen.getByRole('button', { name: 'Guardar Evento' })).toBeInTheDocument();
  });

  it('debe mostrar errores de validación con descripción vacía', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockSubmit} />);

    // Submit with empty description
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));
    expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('debe llamar onSubmit con input válido', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('Descripción'), 'Control anual');
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(mockSubmit).toHaveBeenCalledOnce();
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        descripcion: 'Control anual',
        tipo: 'Consulta Médica',
        reembolsoIsapre: false,
        reembolsoSeguro: false,
      })
    );
  });

  it('debe permitir marcar checkboxes de reembolso', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('Descripción'), 'Test');
    await user.click(screen.getByLabelText('Reembolsado por ISAPRE'));
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        reembolsoIsapre: true,
        reembolsoSeguro: false,
      })
    );
  });

  it('debe mostrar Guardando... cuando loading es true', () => {
    render(<EventForm onSubmit={mockSubmit} loading={true} />);
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
  });

  it('debe limpiar descripción después de submit exitoso', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockSubmit} />);

    const descInput = screen.getByLabelText('Descripción');
    await user.type(descInput, 'Control anual');
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(descInput).toHaveValue('');
  });

  it('debe mostrar error si onSubmit lanza excepción', async () => {
    const user = userEvent.setup();
    const failingSubmit = vi.fn().mockRejectedValue(new Error('Falló la conexión'));
    render(<EventForm onSubmit={failingSubmit} />);

    await user.type(screen.getByLabelText('Descripción'), 'Test');
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(screen.getByText('Falló la conexión')).toBeInTheDocument();
  });

  it('debe renderizar todos los tipos de evento en el select', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    const select = screen.getByLabelText('Tipo de evento');
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll('option');
    expect(options.length).toBe(6);
  });

  it('debe renderizar todos los miembros de familia en el select', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    const select = screen.getByLabelText('Paciente');
    const options = select.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(0);
  });
});
