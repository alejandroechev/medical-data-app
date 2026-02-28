import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistorialPage } from '../../../src/ui/pages/HistorialPage';

vi.mock('../../../src/infra/store-provider', () => ({
  listarEventos: vi.fn(),
  crearEvento: vi.fn(),
  obtenerEventoPorId: vi.fn(),
  actualizarEvento: vi.fn(),
  eliminarEvento: vi.fn(),
}));

import { listarEventos } from '../../../src/infra/store-provider';

const mockListar = vi.mocked(listarEventos);

describe('HistorialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar los filtros', () => {
    mockListar.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(screen.getByLabelText('Paciente')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay resultados', async () => {
    mockListar.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(
      await screen.findByText('No se encontraron eventos con los filtros seleccionados')
    ).toBeInTheDocument();
  });

  it('debe mostrar conteo de eventos', async () => {
    mockListar.mockResolvedValue([
      {
        id: '1',
        fecha: '2024-06-15',
        tipo: 'Consulta Médica' as const,
        descripcion: 'Control',
        pacienteId: '1',
        reembolsoIsapre: false,
        reembolsoSeguro: false,
        creadoEn: '2024-06-15T10:00:00Z',
        actualizadoEn: '2024-06-15T10:00:00Z',
      },
    ]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(await screen.findByText('1 evento encontrado')).toBeInTheDocument();
  });

  it('debe mostrar error cuando la carga falla', async () => {
    mockListar.mockRejectedValue(new Error('Sin conexión'));
    render(<HistorialPage onEventClick={() => {}} />);
    expect(await screen.findByText('Error: Sin conexión')).toBeInTheDocument();
  });

  it('debe tener opción Todos en los selects de filtro', () => {
    mockListar.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);

    const pacienteSelect = screen.getByLabelText('Paciente');
    const tipoSelect = screen.getByLabelText('Tipo');

    expect(pacienteSelect.querySelector('option[value=""]')).toBeTruthy();
    expect(tipoSelect.querySelector('option[value=""]')).toBeTruthy();
  });
});
