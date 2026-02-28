import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuevoEventoPage } from '../../../src/ui/pages/NuevoEventoPage';

vi.mock('../../../src/infra/store-provider', () => ({
  crearEvento: vi.fn(),
  listarEventos: vi.fn(),
  obtenerEventoPorId: vi.fn(),
  actualizarEvento: vi.fn(),
  eliminarEvento: vi.fn(),
}));

import { crearEvento } from '../../../src/infra/store-provider';

const mockCrear = vi.mocked(crearEvento);

describe('NuevoEventoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el formulario de evento', () => {
    render(<NuevoEventoPage onCreated={() => {}} />);
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar Evento' })).toBeInTheDocument();
  });

  it('debe mostrar mensaje de éxito al crear evento', async () => {
    const user = userEvent.setup();
    mockCrear.mockResolvedValue({
      id: 'new-1',
      fecha: '2024-06-15',
      tipo: 'Consulta Médica',
      descripcion: 'Test',
      pacienteId: '1',
      reembolsoIsapre: false,
      reembolsoSeguro: false,
      creadoEn: '2024-06-15T10:00:00Z',
      actualizadoEn: '2024-06-15T10:00:00Z',
    });

    render(<NuevoEventoPage onCreated={() => {}} />);
    await user.type(screen.getByLabelText('Descripción'), 'Test evento');
    await user.click(screen.getByRole('button', { name: 'Guardar Evento' }));

    expect(await screen.findByText('✓ Evento creado exitosamente')).toBeInTheDocument();
  });
});
