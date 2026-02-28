import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from '../../../src/ui/components/BottomNav';

describe('BottomNav', () => {
  it('debe renderizar las tres pestañas', () => {
    render(<BottomNav currentPage="inicio" onNavigate={() => {}} />);
    expect(screen.getByLabelText('Inicio')).toBeInTheDocument();
    expect(screen.getByLabelText('Nuevo')).toBeInTheDocument();
    expect(screen.getByLabelText('Historial')).toBeInTheDocument();
  });

  it('debe resaltar la pestaña activa', () => {
    render(<BottomNav currentPage="historial" onNavigate={() => {}} />);
    const historialBtn = screen.getByLabelText('Historial');
    expect(historialBtn.className).toContain('text-blue-600');
  });

  it('debe llamar onNavigate al hacer clic', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(<BottomNav currentPage="inicio" onNavigate={handleNavigate} />);

    await user.click(screen.getByLabelText('Nuevo'));
    expect(handleNavigate).toHaveBeenCalledWith('nuevo-evento');
  });
});
