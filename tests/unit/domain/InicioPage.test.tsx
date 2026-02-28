import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InicioPage } from '../../../src/ui/pages/InicioPage';

// Mock the store provider
vi.mock('../../../src/infra/store-provider', () => ({
  listarEventos: vi.fn(),
  crearEvento: vi.fn(),
  obtenerEventoPorId: vi.fn(),
  actualizarEvento: vi.fn(),
  eliminarEvento: vi.fn(),
}));

import { listarEventos } from '../../../src/infra/store-provider';

const mockListar = vi.mocked(listarEventos);

describe('InicioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar mensaje de carga inicial', () => {
    mockListar.mockReturnValue(new Promise(() => {})); // never resolves
    render(<InicioPage onEventClick={() => {}} />);
    expect(screen.getByText('Cargando eventos...')).toBeInTheDocument();
  });

  it('debe mostrar estado vacío cuando no hay eventos', async () => {
    mockListar.mockResolvedValue([]);
    render(<InicioPage onEventClick={() => {}} />);
    expect(await screen.findByText('Sin eventos médicos')).toBeInTheDocument();
  });

  it('debe mostrar eventos cuando existen', async () => {
    mockListar.mockResolvedValue([
      {
        id: '1',
        fecha: '2024-06-15',
        tipo: 'Consulta Médica' as const,
        descripcion: 'Control anual',
        pacienteId: '1',
        reembolsoIsapre: false,
        reembolsoSeguro: false,
        creadoEn: '2024-06-15T10:00:00Z',
        actualizadoEn: '2024-06-15T10:00:00Z',
      },
    ]);
    render(<InicioPage onEventClick={() => {}} />);
    expect(await screen.findByText('Control anual')).toBeInTheDocument();
    expect(screen.getByText('Eventos recientes')).toBeInTheDocument();
  });

  it('debe mostrar error cuando la carga falla', async () => {
    mockListar.mockRejectedValue(new Error('Conexión fallida'));
    render(<InicioPage onEventClick={() => {}} />);
    expect(await screen.findByText('Error: Conexión fallida')).toBeInTheDocument();
  });
});
