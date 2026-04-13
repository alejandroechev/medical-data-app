import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventActions, ArchiveAction } from '../../../src/ui/components/EventActions';

describe('EventActions', () => {
  let mockOnChangeIsapre: ReturnType<typeof vi.fn>;
  let mockOnChangeInsurance: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChangeIsapre = vi.fn().mockResolvedValue(undefined);
    mockOnChangeInsurance = vi.fn().mockResolvedValue(undefined);
  });

  it('should show current ISAPRE status badge', () => {
    render(
      <EventActions
        isapreReimbursementStatus="approved"
        insuranceReimbursementStatus="none"
        onChangeIsapreStatus={mockOnChangeIsapre}
        onChangeInsuranceStatus={mockOnChangeInsurance}
      />
    );
    const approvedElements = screen.getAllByText('Aprobado');
    expect(approvedElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should show current insurance status badge', () => {
    render(
      <EventActions
        isapreReimbursementStatus="none"
        insuranceReimbursementStatus="requested"
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

describe('ArchiveAction', () => {
  let mockOnArchive: ReturnType<typeof vi.fn>;
  let mockOnUnarchive: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnArchive = vi.fn().mockResolvedValue(undefined);
    mockOnUnarchive = vi.fn().mockResolvedValue(undefined);
  });

  it('should render the archive button for active events', () => {
    render(<ArchiveAction isArchived={false} onArchive={mockOnArchive} onUnarchive={mockOnUnarchive} />);
    expect(screen.getByRole('button', { name: /archivar evento/i })).toBeInTheDocument();
  });

  it('should show confirmation dialog when archive is clicked', async () => {
    const user = userEvent.setup();
    render(<ArchiveAction isArchived={false} onArchive={mockOnArchive} onUnarchive={mockOnUnarchive} />);

    await user.click(screen.getByRole('button', { name: /archivar evento/i }));
    expect(screen.getByText(/¿estás seguro de archivar este evento\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sí, archivar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('should call onArchive when confirmed', async () => {
    const user = userEvent.setup();
    render(<ArchiveAction isArchived={false} onArchive={mockOnArchive} onUnarchive={mockOnUnarchive} />);

    await user.click(screen.getByRole('button', { name: /archivar evento/i }));
    await user.click(screen.getByRole('button', { name: /sí, archivar/i }));
    expect(mockOnArchive).toHaveBeenCalledOnce();
  });

  it('should not call onArchive when cancelled', async () => {
    const user = userEvent.setup();
    render(<ArchiveAction isArchived={false} onArchive={mockOnArchive} onUnarchive={mockOnUnarchive} />);

    await user.click(screen.getByRole('button', { name: /archivar evento/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockOnArchive).not.toHaveBeenCalled();
    expect(screen.queryByText(/¿estás seguro/i)).not.toBeInTheDocument();
  });

  it('should render the unarchive button for archived events', () => {
    render(<ArchiveAction isArchived onArchive={mockOnArchive} onUnarchive={mockOnUnarchive} />);
    expect(screen.getByRole('button', { name: /desarchivar evento/i })).toBeInTheDocument();
  });

  it('should call onUnarchive when archived event button is clicked', async () => {
    const user = userEvent.setup();
    render(<ArchiveAction isArchived onArchive={mockOnArchive} onUnarchive={mockOnUnarchive} />);

    await user.click(screen.getByRole('button', { name: /desarchivar evento/i }));
    expect(mockOnUnarchive).toHaveBeenCalledOnce();
    expect(screen.queryByText(/¿estás seguro/i)).not.toBeInTheDocument();
  });
});
