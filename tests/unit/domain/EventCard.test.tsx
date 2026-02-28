import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from '../../../src/ui/components/EventCard';
import type { MedicalEvent } from '../../../src/domain/models/medical-event';

const mockEvento: MedicalEvent = {
  id: 'test-123',
  fecha: '2024-06-15',
  tipo: 'Consulta Médica',
  descripcion: 'Control anual con médico general',
  pacienteId: '1', // Alejandro in seed data
  reembolsoIsapre: true,
  reembolsoSeguro: false,
  creadoEn: '2024-06-15T10:00:00Z',
  actualizadoEn: '2024-06-15T10:00:00Z',
};

describe('EventCard', () => {
  it('debe renderizar el tipo de evento', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('Consulta Médica')).toBeInTheDocument();
  });

  it('debe renderizar la fecha', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
  });

  it('debe renderizar la descripción', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('Control anual con médico general')).toBeInTheDocument();
  });

  it('debe renderizar el nombre del paciente', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('Alejandro')).toBeInTheDocument();
  });

  it('debe mostrar badge de ISAPRE cuando está reembolsada', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('ISAPRE ✓')).toBeInTheDocument();
  });

  it('no debe mostrar badge de Seguro cuando no está reembolsada', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.queryByText('Seguro ✓')).not.toBeInTheDocument();
  });

  it('debe llamar onClick con el ID del evento al hacer clic', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<EventCard evento={mockEvento} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('test-123');
  });

  it('debe mostrar icono de urgencia para tipo Urgencia', () => {
    const urgencia: MedicalEvent = { ...mockEvento, tipo: 'Urgencia' };
    render(<EventCard evento={urgencia} onClick={() => {}} />);
    expect(screen.getByText('🚑')).toBeInTheDocument();
  });

  it('debe mostrar Desconocido para paciente sin match', () => {
    const sinPaciente: MedicalEvent = { ...mockEvento, pacienteId: 'no-existe' };
    render(<EventCard evento={sinPaciente} onClick={() => {}} />);
    expect(screen.getByText('Desconocido')).toBeInTheDocument();
  });
});
