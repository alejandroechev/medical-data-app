import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from '../../../src/ui/components/EventCard';
import type { MedicalEvent } from '../../../src/domain/models/medical-event';

const mockEvento: MedicalEvent = {
  id: 'test-123',
  date: '2024-06-15',
  type: 'Consulta Médica',
  description: 'Control anual con médico general',
  patientId: '1', // Alejandro in seed data
  isapreReimbursed: true,
  insuranceReimbursed: false,
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: '2024-06-15T10:00:00Z',
};

describe('EventCard', () => {
  it('should render the event type', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('Consulta Médica')).toBeInTheDocument();
  });

  it('should render the date', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
  });

  it('should render the description', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('Control anual con médico general')).toBeInTheDocument();
  });

  it('should render the patient name', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('Alejandro')).toBeInTheDocument();
  });

  it('should show ISAPRE badge when reimbursed', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.getByText('ISAPRE ✓')).toBeInTheDocument();
  });

  it('should not show insurance badge when not reimbursed', () => {
    render(<EventCard evento={mockEvento} onClick={() => {}} />);
    expect(screen.queryByText('Seguro ✓')).not.toBeInTheDocument();
  });

  it('should call onClick with event ID when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<EventCard evento={mockEvento} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('test-123');
  });

  it('should show emergency icon for Urgencia type', () => {
    const urgencia: MedicalEvent = { ...mockEvento, type: 'Urgencia' };
    render(<EventCard evento={urgencia} onClick={() => {}} />);
    expect(screen.getByText('🚑')).toBeInTheDocument();
  });

  it('should show Desconocido for patient without match', () => {
    const sinPaciente: MedicalEvent = { ...mockEvento, patientId: 'no-existe' };
    render(<EventCard evento={sinPaciente} onClick={() => {}} />);
    expect(screen.getByText('Desconocido')).toBeInTheDocument();
  });
});
