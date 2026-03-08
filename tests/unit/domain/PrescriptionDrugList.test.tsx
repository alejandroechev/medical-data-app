import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrescriptionDrugList } from '../../../src/ui/components/PrescriptionDrugList';

vi.mock('../../../src/infra/store-provider', () => ({
  listAllPrescriptionDrugs: vi.fn().mockResolvedValue([]),
}));

describe('PrescriptionDrugList', () => {
  it('should show empty message when no drugs', () => {
    render(<PrescriptionDrugList drugs={[]} onAdd={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Sin medicamentos registrados')).toBeInTheDocument();
    expect(screen.getByText('💊 Medicamentos (0)')).toBeInTheDocument();
  });

  it('should render existing drugs', () => {
    const drugs = [
      { id: '1', eventId: 'e1', name: 'Amoxicilina', dosage: '500mg', frequency: 'cada 8h', durationDays: 7, createdAt: '2024-01-01T00:00:00Z' },
      { id: '2', eventId: 'e1', name: 'Ibuprofeno', dosage: '400mg', frequency: 'cada 12h', createdAt: '2024-01-01T00:00:00Z' },
    ];
    render(<PrescriptionDrugList drugs={drugs} onAdd={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Amoxicilina')).toBeInTheDocument();
    expect(screen.getByText('Ibuprofeno')).toBeInTheDocument();
    expect(screen.getByText('💊 Medicamentos (2)')).toBeInTheDocument();
    expect(screen.getByText(/500mg — cada 8h — 7 días/)).toBeInTheDocument();
  });

  it('should show form when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<PrescriptionDrugList drugs={[]} onAdd={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByText('+ Agregar medicamento'));
    expect(screen.getByLabelText('Nombre del medicamento')).toBeInTheDocument();
    expect(screen.getByLabelText('Dosis')).toBeInTheDocument();
    expect(screen.getByLabelText('Frecuencia')).toBeInTheDocument();
    expect(screen.getByLabelText('Días de tratamiento')).toBeInTheDocument();
  });

  it('should call onAdd with drug data when form is submitted', async () => {
    const user = userEvent.setup();
    const mockAdd = vi.fn().mockResolvedValue(undefined);
    render(<PrescriptionDrugList drugs={[]} onAdd={mockAdd} onDelete={vi.fn()} />);

    await user.click(screen.getByText('+ Agregar medicamento'));
    await user.type(screen.getByLabelText('Nombre del medicamento'), 'Paracetamol');
    await user.type(screen.getByLabelText('Dosis'), '500mg');
    await user.type(screen.getByLabelText('Frecuencia'), 'cada 6h');
    await user.type(screen.getByLabelText('Días de tratamiento'), '5');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(mockAdd).toHaveBeenCalledWith({
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'cada 6h',
      durationDays: 5,
    });
  });

  it('should show validation error when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<PrescriptionDrugList drugs={[]} onAdd={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByText('+ Agregar medicamento'));
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText(/obligatorios/)).toBeInTheDocument();
  });

  it('should hide form when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<PrescriptionDrugList drugs={[]} onAdd={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByText('+ Agregar medicamento'));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Nombre del medicamento')).not.toBeInTheDocument();
  });
});
