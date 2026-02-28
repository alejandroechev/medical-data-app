import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from '../../../src/ui/components/BottomNav';

describe('BottomNav', () => {
  it('should render the three tabs', () => {
    render(<BottomNav currentPage="inicio" onNavigate={() => {}} />);
    expect(screen.getByLabelText('Inicio')).toBeInTheDocument();
    expect(screen.getByLabelText('Nuevo')).toBeInTheDocument();
    expect(screen.getByLabelText('Historial')).toBeInTheDocument();
  });

  it('should highlight the active tab', () => {
    render(<BottomNav currentPage="historial" onNavigate={() => {}} />);
    const historialBtn = screen.getByLabelText('Historial');
    expect(historialBtn.className).toContain('text-blue-600');
  });

  it('should call onNavigate when clicked', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(<BottomNav currentPage="inicio" onNavigate={handleNavigate} />);

    await user.click(screen.getByLabelText('Nuevo'));
    expect(handleNavigate).toHaveBeenCalledWith('nuevo-evento');
  });
});
