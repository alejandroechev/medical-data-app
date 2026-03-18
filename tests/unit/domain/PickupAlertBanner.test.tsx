import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PickupAlertBanner } from '../../../src/ui/components/PickupAlertBanner';
import type { PickupAlert } from '../../../src/domain/models/pickup-notification';

describe('PickupAlertBanner', () => {
  const mockAlerts: PickupAlert[] = [
    { drugId: 'd1', drugName: 'Atorvastatina', patientId: 'p1', nextPickupDate: '2025-03-18', level: 'reminder', daysUntilPickup: 3 },
    { drugId: 'd2', drugName: 'Losartán', patientId: 'p1', nextPickupDate: '2025-03-15', level: 'due', daysUntilPickup: 0 },
    { drugId: 'd3', drugName: 'Metformina', patientId: 'p2', nextPickupDate: '2025-03-14', level: 'overdue', daysUntilPickup: -1 },
  ];

  it('renders nothing when alerts array is empty', () => {
    const { container } = render(<PickupAlertBanner alerts={[]} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all alerts with drug names', () => {
    render(<PickupAlertBanner alerts={mockAlerts} onDismiss={() => {}} />);
    expect(screen.getByText(/Atorvastatina/)).toBeInTheDocument();
    expect(screen.getByText(/Losartán/)).toBeInTheDocument();
    expect(screen.getByText(/Metformina/)).toBeInTheDocument();
  });

  it('shows reminder text for reminder alerts', () => {
    render(<PickupAlertBanner alerts={[mockAlerts[0]]} onDismiss={() => {}} />);
    expect(screen.getByText(/En 3 días/)).toBeInTheDocument();
  });

  it('shows due text for due alerts', () => {
    render(<PickupAlertBanner alerts={[mockAlerts[1]]} onDismiss={() => {}} />);
    expect(screen.getByText(/Hoy/)).toBeInTheDocument();
  });

  it('shows overdue text for overdue alerts', () => {
    render(<PickupAlertBanner alerts={[mockAlerts[2]]} onDismiss={() => {}} />);
    expect(screen.getByText(/Atrasado/)).toBeInTheDocument();
  });

  it('calls onDismiss with alert key when dismiss is clicked', () => {
    const onDismiss = vi.fn();
    render(<PickupAlertBanner alerts={[mockAlerts[0]]} onDismiss={onDismiss} />);
    const dismissBtn = screen.getByRole('button', { name: /cerrar/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledWith('d1:2025-03-18:reminder');
  });

  it('shows patient name when patientNames map is provided', () => {
    const names = new Map([['p1', 'Juan'], ['p2', 'María']]);
    render(<PickupAlertBanner alerts={mockAlerts} onDismiss={() => {}} patientNames={names} />);
    expect(screen.getAllByText(/Juan/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/María/)).toBeInTheDocument();
  });
});
