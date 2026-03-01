import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableDescription } from '../../../src/ui/components/EditableDescription';

describe('EditableDescription', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSave = vi.fn().mockResolvedValue(undefined);
  });

  it('should render the description text', () => {
    render(<EditableDescription value="Control anual" onSave={mockOnSave} />);
    expect(screen.getByText('Control anual')).toBeInTheDocument();
  });

  it('should show edit button', () => {
    render(<EditableDescription value="Control anual" onSave={mockOnSave} />);
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('should switch to edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<EditableDescription value="Control anual" onSave={mockOnSave} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    expect(screen.getByRole('textbox')).toHaveValue('Control anual');
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('should call onSave with new value', async () => {
    const user = userEvent.setup();
    render(<EditableDescription value="Control anual" onSave={mockOnSave} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'Control actualizado');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(mockOnSave).toHaveBeenCalledWith('Control actualizado');
  });

  it('should exit edit mode after save', async () => {
    const user = userEvent.setup();
    render(<EditableDescription value="Control anual" onSave={mockOnSave} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await vi.waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  it('should cancel editing without saving', async () => {
    const user = userEvent.setup();
    render(<EditableDescription value="Control anual" onSave={mockOnSave} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Texto modificado');
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Control anual')).toBeInTheDocument();
  });

  it('should show error if onSave throws', async () => {
    const user = userEvent.setup();
    const failingSave = vi.fn().mockRejectedValue(new Error('Error de red'));
    render(<EditableDescription value="Control anual" onSave={failingSave} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('Error de red')).toBeInTheDocument();
  });
});
