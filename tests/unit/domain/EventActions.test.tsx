import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventActions } from '../../../src/ui/components/EventActions';

describe('EventActions', () => {
  let mockOnDelete: ReturnType<typeof vi.fn>;
  let mockOnToggleIsapre: ReturnType<typeof vi.fn>;
  let mockOnToggleInsurance: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnDelete = vi.fn().mockResolvedValue(undefined);
    mockOnToggleIsapre = vi.fn().mockResolvedValue(undefined);
    mockOnToggleInsurance = vi.fn().mockResolvedValue(undefined);
  });

  it('should render the delete button', () => {
    render(
      <EventActions
        isapreReimbursed={false}
        insuranceReimbursed={false}
        onDelete={mockOnDelete}
        onToggleIsapre={mockOnToggleIsapre}
        onToggleInsurance={mockOnToggleInsurance}
      />
    );
    expect(screen.getByRole('button', { name: /eliminar evento/i })).toBeInTheDocument();
  });

  it('should show confirmation dialog when delete is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EventActions
        isapreReimbursed={false}
        insuranceReimbursed={false}
        onDelete={mockOnDelete}
        onToggleIsapre={mockOnToggleIsapre}
        onToggleInsurance={mockOnToggleInsurance}
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
        isapreReimbursed={false}
        insuranceReimbursed={false}
        onDelete={mockOnDelete}
        onToggleIsapre={mockOnToggleIsapre}
        onToggleInsurance={mockOnToggleInsurance}
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
        isapreReimbursed={false}
        insuranceReimbursed={false}
        onDelete={mockOnDelete}
        onToggleIsapre={mockOnToggleIsapre}
        onToggleInsurance={mockOnToggleInsurance}
      />
    );

    await user.click(screen.getByRole('button', { name: /eliminar evento/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/¿estás seguro/i)).not.toBeInTheDocument();
  });

  it('should render ISAPRE toggle reflecting current state', () => {
    render(
      <EventActions
        isapreReimbursed={true}
        insuranceReimbursed={false}
        onDelete={mockOnDelete}
        onToggleIsapre={mockOnToggleIsapre}
        onToggleInsurance={mockOnToggleInsurance}
      />
    );
    const checkbox = screen.getByLabelText(/isapre/i);
    expect(checkbox).toBeChecked();
  });

  it('should render insurance toggle reflecting current state', () => {
    render(
      <EventActions
        isapreReimbursed={false}
        insuranceReimbursed={true}
        onDelete={mockOnDelete}
        onToggleIsapre={mockOnToggleIsapre}
        onToggleInsurance={mockOnToggleInsurance}
      />
    );
    const checkbox = screen.getByLabelText(/seguro complementario/i);
    expect(checkbox).toBeChecked();
  });

  it('should call onToggleIsapre when ISAPRE checkbox is toggled', async () => {
    const user = userEvent.setup();
    render(
      <EventActions
        isapreReimbursed={false}
        insuranceReimbursed={false}
        onDelete={mockOnDelete}
        onToggleIsapre={mockOnToggleIsapre}
        onToggleInsurance={mockOnToggleInsurance}
      />
    );

    await user.click(screen.getByLabelText(/isapre/i));
    expect(mockOnToggleIsapre).toHaveBeenCalledWith(true);
  });

  it('should call onToggleInsurance when insurance checkbox is toggled', async () => {
    const user = userEvent.setup();
    render(
      <EventActions
        isapreReimbursed={false}
        insuranceReimbursed={false}
        onDelete={mockOnDelete}
        onToggleIsapre={mockOnToggleIsapre}
        onToggleInsurance={mockOnToggleInsurance}
      />
    );

    await user.click(screen.getByLabelText(/seguro complementario/i));
    expect(mockOnToggleInsurance).toHaveBeenCalledWith(true);
  });
});
