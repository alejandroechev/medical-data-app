import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from '../../../src/ui/components/BottomNav';

describe('BottomNav', () => {
  it('should render the three tabs', () => {
    render(<BottomNav currentPage="inicio" onNavigate={() => {}} />);
    expect(screen.getByLabelText('Inicio')).toBeInTheDocument();
    expect(screen.getByLabelText('Eventos')).toBeInTheDocument();
    expect(screen.getByLabelText('Tratamientos')).toBeInTheDocument();
  });

  it('should highlight the active tab', () => {
    render(<BottomNav currentPage="eventos" onNavigate={() => {}} />);
    const eventosBtn = screen.getByLabelText('Eventos');
    expect(eventosBtn.className).toContain('text-blue-600');
  });

  it('should call onNavigate when clicked', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(<BottomNav currentPage="inicio" onNavigate={handleNavigate} />);

    await user.click(screen.getByLabelText('Eventos'));
    expect(handleNavigate).toHaveBeenCalledWith('eventos');
  });

  it('should use svg icons instead of emoji glyphs', () => {
    const { container } = render(<BottomNav currentPage="inicio" onNavigate={() => {}} />);
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText('🏠')).not.toBeInTheDocument();
    expect(screen.queryByText('➕')).not.toBeInTheDocument();
  });
});
