import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../../src/ui/components/Header';

describe('Header', () => {
  it('debe renderizar el título', () => {
    render(<Header titulo="Mi Título" />);
    expect(screen.getByText('Mi Título')).toBeInTheDocument();
  });

  it('no debe mostrar botón de volver si no se pasa onBack', () => {
    render(<Header titulo="Sin Volver" />);
    expect(screen.queryByLabelText('Volver')).not.toBeInTheDocument();
  });

  it('debe mostrar botón de volver si se pasa onBack', () => {
    render(<Header titulo="Con Volver" onBack={() => {}} />);
    expect(screen.getByLabelText('Volver')).toBeInTheDocument();
  });

  it('debe llamar onBack al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    const handleBack = vi.fn();
    render(<Header titulo="Test" onBack={handleBack} />);

    await user.click(screen.getByLabelText('Volver'));
    expect(handleBack).toHaveBeenCalledOnce();
  });
});
