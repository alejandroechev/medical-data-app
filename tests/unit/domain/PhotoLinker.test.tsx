import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoLinker } from '../../../src/ui/components/PhotoLinker';

// Mock store-provider upload
vi.mock('../../../src/infra/store-provider', () => ({
  uploadPhoto: vi.fn().mockResolvedValue({ url: 'https://test.supabase.co/photo.jpg', fileName: 'photo.jpg' }),
}));

describe('PhotoLinker', () => {
  let mockOnLink: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnLink = vi.fn().mockResolvedValue(undefined);
  });

  it('should render the link photo button', () => {
    render(<PhotoLinker eventId="ev-1" onPhotoLinked={mockOnLink} />);
    expect(screen.getByRole('button', { name: /vincular foto/i })).toBeInTheDocument();
  });

  it('should show the form when Pegar URL is clicked', async () => {
    const user = userEvent.setup();
    render(<PhotoLinker eventId="ev-1" onPhotoLinked={mockOnLink} />);

    await user.click(screen.getByRole('button', { name: /vincular foto/i }));
    await user.click(screen.getByText('Pegar URL'));
    expect(screen.getByLabelText(/url de la foto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('should show validation error when URL is empty', async () => {
    const user = userEvent.setup();
    render(<PhotoLinker eventId="ev-1" onPhotoLinked={mockOnLink} />);

    await user.click(screen.getByRole('button', { name: /vincular foto/i }));
    await user.click(screen.getByText('Pegar URL'));
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    expect(screen.getByText(/la url es obligatoria/i)).toBeInTheDocument();
  });

  it('should call onPhotoLinked with correct data when form is valid', async () => {
    const user = userEvent.setup();
    render(<PhotoLinker eventId="ev-1" onPhotoLinked={mockOnLink} />);

    await user.click(screen.getByRole('button', { name: /vincular foto/i }));
    await user.click(screen.getByText('Pegar URL'));
    await user.type(screen.getByLabelText(/url de la foto/i), 'https://example.com/photo/abc123');
    await user.type(screen.getByLabelText(/descripción/i), 'Receta médica');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(mockOnLink).toHaveBeenCalledWith({
      eventId: 'ev-1',
      googlePhotosUrl: 'https://example.com/photo/abc123',
      googlePhotosId: expect.any(String),
      description: 'Receta médica',
    });
  });

  it('should hide the form after successful link', async () => {
    const user = userEvent.setup();
    render(<PhotoLinker eventId="ev-1" onPhotoLinked={mockOnLink} />);

    await user.click(screen.getByRole('button', { name: /vincular foto/i }));
    await user.click(screen.getByText('Pegar URL'));
    await user.type(screen.getByLabelText(/url de la foto/i), 'https://example.com/photo/abc');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await vi.waitFor(() => {
      expect(screen.queryByLabelText(/url de la foto/i)).not.toBeInTheDocument();
    });
  });

  it('should allow cancelling the form', async () => {
    const user = userEvent.setup();
    render(<PhotoLinker eventId="ev-1" onPhotoLinked={mockOnLink} />);

    await user.click(screen.getByRole('button', { name: /vincular foto/i }));
    await user.click(screen.getByText('Pegar URL'));
    expect(screen.getByLabelText(/url de la foto/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByLabelText(/url de la foto/i)).not.toBeInTheDocument();
  });

  it('should show error if onPhotoLinked throws', async () => {
    const user = userEvent.setup();
    const failingLink = vi.fn().mockRejectedValue(new Error('Error de conexión'));
    render(<PhotoLinker eventId="ev-1" onPhotoLinked={failingLink} />);

    await user.click(screen.getByRole('button', { name: /vincular foto/i }));
    await user.click(screen.getByText('Pegar URL'));
    await user.type(screen.getByLabelText(/url de la foto/i), 'https://example.com/photo/abc');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
  });
});
