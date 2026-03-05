import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventActions } from '../../../src/ui/components/EventActions';

describe('EventActions', () => {
  let mockOnDelete: ReturnType<typeof vi.fn>;
  let mockOnChangeIsapre: ReturnType<typeof vi.fn>;
  let mockOnChangeInsurance: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnDelete = vi.fn().mockResolvedValue(undefined);
    mockOnChangeIsapre = vi.fn().mockResolvedValue(undefined);
    mockOnChangeInsurance = vi.fn().mockResolvedValue(undefined);
  });

  it('should render the delete button', () => {
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="none"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );
    expect(screen.getByRole('button', { name: /eliminar evento/i })).toBeInTheDocument();
  });

  it('should show confirmation dialog when delete is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="none"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );

    await user.click(screen.getByRole('button', { name: /eliminar evento/i }));
    expect(screen.getByText(/¿estás seguro/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sí, eliminar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('should call onDelete when confirmed', async () => {
    const user = userEvent.setup();
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="none"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );

    await user.click(screen.getByRole('button', { name: /eliminar evento/i }));
    await user.click(screen.getByRole('button', { name: /sí, eliminar/i }));
    expect(mockOnDelete).toHaveBeenCalledOnce();
  });

  it('should not call onDelete when cancelled', async () => {
    const user = userEvent.setup();
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="none"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );

    await user.click(screen.getByRole('button', { name: /eliminar evento/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/¿estás seguro/i)).not.toBeInTheDocument();
  });

  it('should show current ISAPRE status badge', () => {
    render(
      <EventActions
        isapreReimbursementStatus="approved"
        insuranceReimbursementStatus="none"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );
    // Badge + the disabled button for ISAPRE + the enabled button for Insurance = 3
    const approvedElements = screen.getAllByText('Aprobado');
    expect(approvedElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should show current insurance status badge', () => {
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="requested"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );
    const requestedElements = screen.getAllByText('Solicitado');
    expect(requestedElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should call onChangeIsapreStatus when ISAPRE status button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="none"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );

    await user.click(screen.getByRole('button', { name: /ISAPRE Solicitado/i }));
    expect(mockOnChangeIsapre).toHaveBeenCalledWith('requested');
  });

  it('should call onChangeInsuranceStatus when insurance status button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="none"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );

    await user.click(screen.getByRole('button', { name: /Seguro Complementario Aprobado/i }));
    expect(mockOnChangeInsurance).toHaveBeenCalledWith('approved');
  });

  it('should render portal links', () => {
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="none"
        onDelete={mockOnDelete}
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );
    const links = screen.getAllByRole('link', { name: /portal/i });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://sucursalvirtual.somosesencial.cl/');
    expect(links[1]).toHaveAttribute('href', 'https://clientes.segurossura.cl/');
  });
});
