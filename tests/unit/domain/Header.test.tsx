import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../../src/ui/components/Header';

describe('Header', () => {
  it('should render the title', () => {
    render(<Header titulo="Mi Título" />);
    expect(screen.getByText('Mi Título')).toBeInTheDocument();
  });

  it('should not show back button when onBack is not provided', () => {
    render(<Header titulo="Sin Volver" />);
    expect(screen.queryByLabelText('Volver')).not.toBeInTheDocument();
  });

  it('should show back button when onBack is provided', () => {
    render(<Header titulo="Con Volver" onBack={() => {}} />);
    expect(screen.getByLabelText('Volver')).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const handleBack = vi.fn();
    render(<Header titulo="Test" onBack={handleBack} />);

    await user.click(screen.getByLabelText('Volver'));
    expect(handleBack).toHaveBeenCalledOnce();
  });
});
