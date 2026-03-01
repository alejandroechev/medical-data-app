import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DetalleEventoPage } from '../../../src/ui/pages/DetalleEventoPage';

vi.mock('../../../src/infra/store-provider', () => ({
  getEventById: vi.fn(),
  createEvent: vi.fn(),
  listEvents: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  listPhotosByEvent: vi.fn(),
  linkPhoto: vi.fn(),
  unlinkPhoto: vi.fn(),
}));

import { getEventById, listPhotosByEvent } from '../../../src/infra/store-provider';

const mockGetById = vi.mocked(getEventById);
const mockListPhotos = vi.mocked(listPhotosByEvent);

describe('DetalleEventoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading message', () => {
    mockGetById.mockReturnValue(new Promise(() => {}));
    mockListPhotos.mockReturnValue(new Promise(() => {}));
    render(<DetalleEventoPage eventoId="test-1" />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should show event details', async () => {
    mockGetById.mockResolvedValue({
      id: 'test-1',
      date: '2024-06-15',
      type: 'Urgencia',
      description: 'Dolor abdominal severo',
      patientId: '1',
      isapreReimbursed: true,
      insuranceReimbursed: false,
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    });
    mockListPhotos.mockResolvedValue([]);

    render(<DetalleEventoPage eventoId="test-1" />);
    expect(await screen.findByText('Urgencia')).toBeInTheDocument();
    expect(screen.getByText('Dolor abdominal severo')).toBeInTheDocument();
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
    expect(screen.getByLabelText('ISAPRE')).toBeChecked();
    expect(screen.getByLabelText('Seguro Complementario')).not.toBeChecked();
    expect(screen.getByText('Alejandro')).toBeInTheDocument();
  });

  it('should show linked photos', async () => {
    mockGetById.mockResolvedValue({
      id: 'test-1',
      date: '2024-06-15',
      type: 'Examen',
      description: 'Examen de sangre',
      patientId: '1',
      isapreReimbursed: false,
      insuranceReimbursed: false,
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    });
    mockListPhotos.mockResolvedValue([
      {
        id: 'foto-1',
        eventId: 'test-1',
        googlePhotosUrl: 'https://photos.google.com/photo/abc',
        googlePhotosId: 'abc',
        description: 'Resultado examen',
        createdAt: '2024-06-15T10:00:00Z',
      },
    ]);

    render(<DetalleEventoPage eventoId="test-1" />);
    expect(await screen.findByText('Resultado examen')).toBeInTheDocument();
    expect(screen.getByText('Documentos (1)')).toBeInTheDocument();
  });

  it('should show error when event is not found', async () => {
    mockGetById.mockResolvedValue(null);
    mockListPhotos.mockResolvedValue([]);

    render(<DetalleEventoPage eventoId="no-existe" />);
    expect(await screen.findByText('Evento no encontrado')).toBeInTheDocument();
  });

  it('should show load error', async () => {
    mockGetById.mockRejectedValue(new Error('Error de red'));
    mockListPhotos.mockResolvedValue([]);

    render(<DetalleEventoPage eventoId="test-1" />);
    expect(await screen.findByText('Error de red')).toBeInTheDocument();
  });
});
