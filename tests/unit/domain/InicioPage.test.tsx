import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InicioPage } from '../../../src/ui/pages/InicioPage';

// Mock the store provider
vi.mock('../../../src/infra/store-provider', () => ({
  listEvents: vi.fn().mockResolvedValue([]),
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  listActivePatientDrugs: vi.fn().mockResolvedValue([]),
}));

describe('InicioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dashboard layout', async () => {
    render(<InicioPage />);
    // InicioPage renders FamilySummary + ExpenseSummary
    // With no data, FamilySummary shows loading then nothing; page still renders
    const container = document.querySelector('.p-4.space-y-4');
    expect(container).toBeInTheDocument();
  });

  it('should not show recent events list', async () => {
    render(<InicioPage />);
    expect(screen.queryByText('Eventos recientes')).not.toBeInTheDocument();
  });
});
