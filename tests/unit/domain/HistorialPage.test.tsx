import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistorialPage } from '../../../src/ui/pages/HistorialPage';

vi.setConfig({ testTimeout: 10000 });

vi.mock('../../../src/infra/store-provider', () => ({
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  listProfessionals: vi.fn().mockResolvedValue([]),
  createProfessional: vi.fn(),
  listLocations: vi.fn().mockResolvedValue([]),
  createLocation: vi.fn(),
  listPrescriptionDrugsByEvent: vi.fn().mockResolvedValue([]),
  listPatientDrugsByEvent: vi.fn().mockResolvedValue([]),
  listAllPrescriptionDrugs: vi.fn().mockResolvedValue([]),
  listAllPatientDrugs: vi.fn().mockResolvedValue([]),
}));

import { listEvents, listPrescriptionDrugsByEvent, listPatientDrugsByEvent, listAllPrescriptionDrugs, listAllPatientDrugs } from '../../../src/infra/store-provider';

const mockList = vi.mocked(listEvents);
const mockListDrugs = vi.mocked(listPrescriptionDrugsByEvent);
const mockListPatientDrugsByEvent = vi.mocked(listPatientDrugsByEvent);
const mockListAllDrugs = vi.mocked(listAllPrescriptionDrugs);
const mockListAllPatientDrugs = vi.mocked(listAllPatientDrugs);

describe('HistorialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListDrugs.mockResolvedValue([]);
    mockListPatientDrugsByEvent.mockResolvedValue([]);
    mockListAllDrugs.mockResolvedValue([]);
    mockListAllPatientDrugs.mockResolvedValue([]);
  });

  it('should render the filters', () => {
    mockList.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(screen.getByLabelText('Paciente')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
    expect(screen.getByLabelText('ISAPRE')).toBeInTheDocument();
    expect(screen.getByLabelText('Seguro')).toBeInTheDocument();
    expect(screen.getByLabelText('Medicamento')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar archivados')).toBeInTheDocument();
  });

  it('should pass includeArchived filter when toggle is enabled', async () => {
    mockList.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<HistorialPage onEventClick={() => {}} />);

    await screen.findByText(/encontrado/);
    mockList.mockClear();

    await user.click(screen.getByLabelText('Mostrar archivados'));

    await vi.waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ includeArchived: true })
      );
    });
  });

  it('should show message when there are no results', async () => {
    mockList.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(
      await screen.findByText('No se encontraron eventos con los filtros seleccionados')
    ).toBeInTheDocument();
  });

  it('should show event count', async () => {
    mockList.mockResolvedValue([
      {
        id: '1',
        date: '2024-06-15',
        type: 'Consulta Médica' as const,
        description: 'Control',
        patientId: '1',
        isapreReimbursementStatus: 'none' as const,
        insuranceReimbursementStatus: 'none' as const,
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
      },
    ]);
    render(<HistorialPage onEventClick={() => {}} />);
    expect(await screen.findByText('1 evento encontrado')).toBeInTheDocument();
  });

  it('should show error when load fails', async () => {
    mockList.mockRejectedValue(new Error('Sin conexión'));
    render(<HistorialPage onEventClick={() => {}} />);
    expect(await screen.findByText('Error: Sin conexión')).toBeInTheDocument();
  });

  it('should have "Todos" option in filter selects', () => {
    mockList.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);

    const pacienteSelect = screen.getByLabelText('Paciente');
    const tipoSelect = screen.getByLabelText('Tipo');

    expect(pacienteSelect.querySelector('option[value=""]')).toBeTruthy();
    expect(tipoSelect.querySelector('option[value=""]')).toBeTruthy();
  });

  it('should have reimbursement status options in ISAPRE filter', () => {
    mockList.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);

    const isapreSelect = screen.getByLabelText('ISAPRE');
    const options = Array.from(isapreSelect.querySelectorAll('option')).map(o => o.textContent);
    expect(options).toContain('Todos');
    expect(options).toContain('Sin solicitar');
    expect(options).toContain('Solicitado');
    expect(options).toContain('Aprobado');
    expect(options).toContain('Rechazado');
  });

  it('should have reimbursement status options in Seguro filter', () => {
    mockList.mockResolvedValue([]);
    render(<HistorialPage onEventClick={() => {}} />);

    const seguroSelect = screen.getByLabelText('Seguro');
    const options = Array.from(seguroSelect.querySelectorAll('option')).map(o => o.textContent);
    expect(options).toContain('Todos');
    expect(options).toContain('Sin solicitar');
    expect(options).toContain('Solicitado');
    expect(options).toContain('Aprobado');
    expect(options).toContain('Rechazado');
  });

  it('should pass ISAPRE status filter to listEvents', async () => {
    mockList.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<HistorialPage onEventClick={() => {}} />);

    await screen.findByText(/encontrado/);
    mockList.mockClear();

    await user.selectOptions(screen.getByLabelText('ISAPRE'), 'approved');

    await vi.waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ isapreReimbursementStatus: 'approved' })
      );
    });
  });

  it('should pass Seguro status filter to listEvents', async () => {
    mockList.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<HistorialPage onEventClick={() => {}} />);

    await screen.findByText(/encontrado/);
    mockList.mockClear();

    await user.selectOptions(screen.getByLabelText('Seguro'), 'requested');

    await vi.waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ insuranceReimbursementStatus: 'requested' })
      );
    });
  });

  it('should filter Receta events by drug name select', async () => {
    mockListAllDrugs.mockResolvedValue([
      { id: 'd1', eventId: 'receta-1', name: 'Amoxicilina', dosage: '500mg', frequency: 'cada 8h', createdAt: '2024-06-15T10:00:00Z' },
    ]);
    mockList.mockResolvedValue([
      {
        id: 'receta-1',
        date: '2024-06-15',
        type: 'Receta' as const,
        description: 'Receta antibiótico',
        patientId: '1',
        isapreReimbursementStatus: 'none' as const,
        insuranceReimbursementStatus: 'none' as const,
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
      },
      {
        id: 'consulta-1',
        date: '2024-06-15',
        type: 'Consulta Médica' as const,
        description: 'Control general',
        patientId: '1',
        isapreReimbursementStatus: 'none' as const,
        insuranceReimbursementStatus: 'none' as const,
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
      },
    ]);
    mockListDrugs.mockImplementation(async (eventId: string) => (
      eventId === 'receta-1'
        ? [{ id: 'd1', eventId: 'receta-1', name: 'Amoxicilina', dosage: '500mg', frequency: 'cada 8h', createdAt: '2024-06-15T10:00:00Z' }]
        : []
    ));

    const user = userEvent.setup();
    render(<HistorialPage onEventClick={() => {}} />);

    await screen.findByText('2 eventos encontrados');

    await user.selectOptions(screen.getByLabelText('Medicamento'), 'Amoxicilina');

    await vi.waitFor(() => {
      expect(screen.getByText('1 evento encontrado')).toBeInTheDocument();
    });
    expect(screen.getByText('Receta antibiótico')).toBeInTheDocument();
    expect(screen.queryByText('Control general')).not.toBeInTheDocument();
  });

  it('should include patient treatment names in the medicamento filter', async () => {
    mockList.mockResolvedValue([]);
    mockListAllPatientDrugs.mockResolvedValue([
      {
        id: 'pd-1',
        patientId: '1',
        eventId: 'evt-1',
        name: 'Ibuprofeno',
        dosage: '600mg',
        schedule: { type: 'interval', intervalHours: 8 },
        duration: { type: 'days', days: 5 },
        startDate: '2024-06-15',
        isPermanent: false,
        status: 'active',
        createdAt: '2024-06-15T10:00:00Z',
      },
    ]);

    render(<HistorialPage onEventClick={() => {}} />);

    expect(await screen.findByRole('option', { name: 'Ibuprofeno' })).toBeInTheDocument();
  });
});
