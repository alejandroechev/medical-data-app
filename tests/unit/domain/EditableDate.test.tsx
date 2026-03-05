import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableDate } from '../../../src/ui/components/EditableDate';

describe('EditableDate', () => {
  it('should render the date value in read mode', () => {
    render(<EditableDate value="2024-06-15" onSave={vi.fn()} />);
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
  });

  it('should render the edit button', () => {
    render(<EditableDate value="2024-06-15" onSave={vi.fn()} />);
    expect(screen.getByRole('button', { name: /editar fecha/i })).toBeInTheDocument();
  });

  it('should switch to edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<EditableDate value="2024-06-15" onSave={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /editar fecha/i }));
    expect(screen.getByLabelText('Fecha del evento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('should call onSave with new date when saved', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableDate value="2024-06-15" onSave={mockSave} />);

    await user.click(screen.getByRole('button', { name: /editar fecha/i }));
    const input = screen.getByLabelText('Fecha del evento');
    await user.clear(input);
    await user.type(input, '2024-07-20');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(mockSave).toHaveBeenCalledWith('2024-07-20');
  });

  it('should cancel without saving', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn();
    render(<EditableDate value="2024-06-15" onSave={mockSave} />);

    await user.click(screen.getByRole('button', { name: /editar fecha/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(mockSave).not.toHaveBeenCalled();
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
  });

  it('should show error when onSave throws', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn().mockRejectedValue(new Error('Error al guardar'));
    render(<EditableDate value="2024-06-15" onSave={mockSave} />);

    await user.click(screen.getByRole('button', { name: /editar fecha/i }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('Error al guardar')).toBeInTheDocument();
  });
});
