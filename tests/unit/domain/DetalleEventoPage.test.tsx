import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DetalleEventoPage } from '../../../src/ui/pages/DetalleEventoPage';

vi.mock('../../../src/infra/supabase/medical-event-store', () => ({
  obtenerEventoPorId: vi.fn(),
  crearEvento: vi.fn(),
  listarEventos: vi.fn(),
  actualizarEvento: vi.fn(),
  eliminarEvento: vi.fn(),
}));

vi.mock('../../../src/infra/supabase/event-photo-store', () => ({
  listarFotosPorEvento: vi.fn(),
  vincularFoto: vi.fn(),
  desvincularFoto: vi.fn(),
}));

import { obtenerEventoPorId } from '../../../src/infra/supabase/medical-event-store';
import { listarFotosPorEvento } from '../../../src/infra/supabase/event-photo-store';

const mockObtener = vi.mocked(obtenerEventoPorId);
const mockListarFotos = vi.mocked(listarFotosPorEvento);

describe('DetalleEventoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar mensaje de carga', () => {
    mockObtener.mockReturnValue(new Promise(() => {}));
    mockListarFotos.mockReturnValue(new Promise(() => {}));
    render(<DetalleEventoPage eventoId="test-1" />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('debe mostrar detalles del evento', async () => {
    mockObtener.mockResolvedValue({
      id: 'test-1',
      fecha: '2024-06-15',
      tipo: 'Urgencia',
      descripcion: 'Dolor abdominal severo',
      pacienteId: '1',
      reembolsoIsapre: true,
      reembolsoSeguro: false,
      creadoEn: '2024-06-15T10:00:00Z',
      actualizadoEn: '2024-06-15T10:00:00Z',
    });
    mockListarFotos.mockResolvedValue([]);

    render(<DetalleEventoPage eventoId="test-1" />);
    expect(await screen.findByText('Urgencia')).toBeInTheDocument();
    expect(screen.getByText('Dolor abdominal severo')).toBeInTheDocument();
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
    expect(screen.getByText('Reembolsada ✓')).toBeInTheDocument();
    expect(screen.getByText('No reembolsada')).toBeInTheDocument();
    expect(screen.getByText('Alejandro')).toBeInTheDocument();
  });

  it('debe mostrar fotos vinculadas', async () => {
    mockObtener.mockResolvedValue({
      id: 'test-1',
      fecha: '2024-06-15',
      tipo: 'Examen',
      descripcion: 'Examen de sangre',
      pacienteId: '1',
      reembolsoIsapre: false,
      reembolsoSeguro: false,
      creadoEn: '2024-06-15T10:00:00Z',
      actualizadoEn: '2024-06-15T10:00:00Z',
    });
    mockListarFotos.mockResolvedValue([
      {
        id: 'foto-1',
        eventoId: 'test-1',
        googlePhotosUrl: 'https://photos.google.com/photo/abc',
        googlePhotosId: 'abc',
        descripcion: 'Resultado examen',
        creadoEn: '2024-06-15T10:00:00Z',
      },
    ]);

    render(<DetalleEventoPage eventoId="test-1" />);
    expect(await screen.findByText('Resultado examen')).toBeInTheDocument();
    expect(screen.getByText('Documentos (1)')).toBeInTheDocument();
  });

  it('debe mostrar error cuando evento no se encuentra', async () => {
    mockObtener.mockResolvedValue(null);
    mockListarFotos.mockResolvedValue([]);

    render(<DetalleEventoPage eventoId="no-existe" />);
    expect(await screen.findByText('Evento no encontrado')).toBeInTheDocument();
  });

  it('debe mostrar error de carga', async () => {
    mockObtener.mockRejectedValue(new Error('Error de red'));
    mockListarFotos.mockResolvedValue([]);

    render(<DetalleEventoPage eventoId="test-1" />);
    expect(await screen.findByText('Error de red')).toBeInTheDocument();
  });
});
