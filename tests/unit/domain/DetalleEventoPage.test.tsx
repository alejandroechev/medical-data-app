import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DetalleEventoPage } from '../../../src/ui/pages/DetalleEventoPage';

vi.mock('../../../src/infra/store-provider', () => ({
  getEventById: vi.fn(),
  archiveEvent: vi.fn(),
  unarchiveEvent: vi.fn(),
  createEvent: vi.fn(),
  listEvents: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  listPhotosByEvent: vi.fn(),
  linkPhoto: vi.fn(),
  unlinkPhoto: vi.fn(),
  uploadPhoto: vi.fn(),
  createRecording: vi.fn(),
  listRecordingsByEvent: vi.fn().mockResolvedValue([]),
  deleteRecording: vi.fn(),
  listProfessionals: vi.fn().mockResolvedValue([]),
  createProfessional: vi.fn(),
  listLocations: vi.fn().mockResolvedValue([]),
  createLocation: vi.fn(),
  createPatientDrug: vi.fn(),
  listPatientDrugsByEvent: vi.fn().mockResolvedValue([]),
  updatePatientDrug: vi.fn(),
  deletePatientDrug: vi.fn(),
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
      patientId: '861ac938-aad9-4172-b21a-b7be9ff10676',
      isapreReimbursementStatus: 'approved',
      insuranceReimbursementStatus: 'none',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    });
    mockListPhotos.mockResolvedValue([]);

    render(<DetalleEventoPage eventoId="test-1" />);
    expect(await screen.findByText('Urgencia')).toBeInTheDocument();
    expect(screen.getByText('Dolor abdominal severo')).toBeInTheDocument();
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
    expect(screen.getByText('Alejandro')).toBeInTheDocument();
  });

  it('should show linked photos', async () => {
    mockGetById.mockResolvedValue({
      id: 'test-1',
      date: '2024-06-15',
      type: 'Examen',
      description: 'Examen de sangre',
      patientId: '861ac938-aad9-4172-b21a-b7be9ff10676',
      isapreReimbursementStatus: 'none',
      insuranceReimbursementStatus: 'none',
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
