import { useState, useEffect, useCallback } from 'react';
import { listEvents, archiveEvent, createEvent } from '../../infra/store-provider';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { listAllPatientDrugs } from '../../infra/store-provider';
import { SwipeableEventCard } from '../components/SwipeableEventCard';
import { commonIcons } from '../components/icons';
import type { MedicalEvent } from '../../domain/models/medical-event';

interface EventosPageProps {
  onEventClick: (id: string) => void;
  onCreateEvent: () => void;
  initialPatientId?: string;
}

type FilterState = {
  patientId: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  isapreStatus: string;
  insuranceStatus: string;
  drugName: string;
  includeArchived: boolean;
};

const DEFAULT_FILTERS: FilterState = {
  patientId: '',
  type: '',
  dateFrom: '',
  dateTo: '',
  isapreStatus: '',
  insuranceStatus: '',
  drugName: '',
  includeArchived: false,
};

export function EventosPage({ onEventClick, onCreateEvent, initialPatientId }: EventosPageProps) {
  const members = getFamilyMembers();
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    patientId: initialPatientId ?? '',
  });
  const [knownDrugNames, setKnownDrugNames] = useState<string[]>([]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listEvents({
        patientId: filters.patientId || undefined,
        type: filters.type || undefined,
        from: filters.dateFrom || undefined,
        to: filters.dateTo || undefined,
        isapreReimbursementStatus: (filters.isapreStatus || undefined) as MedicalEvent['isapreReimbursementStatus'],
        insuranceReimbursementStatus: (filters.insuranceStatus || undefined) as MedicalEvent['insuranceReimbursementStatus'],
        includeArchived: filters.includeArchived,
      });

      let filtered = data;
      if (filters.drugName) {
        const eventsWithDrug = new Set<string>();
        // Load drugs to match
        const allDrugs = await listAllPatientDrugs();
        allDrugs
          .filter((d) => d.name.toLowerCase().includes(filters.drugName.toLowerCase()))
          .forEach((d) => { if (d.eventId) eventsWithDrug.add(d.eventId); });
        filtered = filtered.filter((e) => eventsWithDrug.has(e.id));
      }

      setEvents(filtered);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    listAllPatientDrugs().then((drugs) => {
      const names = [...new Set(drugs.map((d) => d.name))].sort();
      setKnownDrugNames(names);
    });
  }, []);

  const handleArchive = async (id: string) => {
    await archiveEvent(id);
    await loadEvents();
  };

  const handleDuplicate = async (id: string) => {
    const original = events.find((e) => e.id === id);
    if (!original) return;
    const today = new Date().toISOString().split('T')[0];
    const newEvent = await createEvent({
      date: today,
      type: original.type,
      description: original.description,
      patientId: original.patientId,
      professionalId: original.professionalId,
      locationId: original.locationId,
      cost: original.cost,
    });
    onEventClick(newEvent.id);
  };

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const reimbursementOptions = [
    { value: '', label: 'Todos' },
    { value: 'none', label: 'Sin solicitar' },
    { value: 'requested', label: 'Solicitado' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' },
  ];

  return (
    <div className="p-4 pb-20 space-y-3">
      {/* Filter toggle */}
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="w-full flex items-center justify-between py-2 px-3 bg-white rounded-lg shadow-sm border border-gray-100 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5">
          <commonIcons.search className="h-4 w-4" aria-hidden="true" />
          Filtros
        </span>
        {filtersOpen ? (
          <commonIcons.chevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <commonIcons.chevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {/* Collapsible filters */}
      {filtersOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filtro-paciente" className="block text-xs text-gray-500 mb-1">Paciente</label>
              <select
                id="filtro-paciente"
                value={filters.patientId}
                onChange={(e) => updateFilter('patientId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="">Todos</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtro-tipo" className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select
                id="filtro-tipo"
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="">Todos</option>
                {['Consulta Médica', 'Consulta Dental', 'Urgencia', 'Cirugía', 'Examen', 'Receta', 'Otro'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filtro-desde" className="block text-xs text-gray-500 mb-1">Desde</label>
              <input
                id="filtro-desde"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="filtro-hasta" className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input
                id="filtro-hasta"
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filtro-isapre" className="block text-xs text-gray-500 mb-1">ISAPRE</label>
              <select
                id="filtro-isapre"
                value={filters.isapreStatus}
                onChange={(e) => updateFilter('isapreStatus', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              >
                {reimbursementOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtro-seguro" className="block text-xs text-gray-500 mb-1">Seguro</label>
              <select
                id="filtro-seguro"
                value={filters.insuranceStatus}
                onChange={(e) => updateFilter('insuranceStatus', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              >
                {reimbursementOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="filtro-medicamento" className="block text-xs text-gray-500 mb-1">Medicamento</label>
            <select
              id="filtro-medicamento"
              value={filters.drugName}
              onChange={(e) => updateFilter('drugName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {knownDrugNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="filtro-archivados"
              type="checkbox"
              checked={filters.includeArchived}
              onChange={(e) => updateFilter('includeArchived', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="filtro-archivados" className="text-sm text-gray-700">Mostrar archivados</label>
          </div>

          {/* Expense summary when filters are active */}
        </div>
      )}

      {/* Event count */}
      {!loading && (
        <p className="text-xs text-gray-400">
          {events.length} evento{events.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Event list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error: {error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <commonIcons.clipboard className="h-8 w-8 mx-auto text-gray-400" aria-hidden="true" />
          <p className="text-gray-400 text-sm mt-2">Sin eventos encontrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evento) => (
            <SwipeableEventCard
              key={evento.id}
              evento={evento}
              onClick={onEventClick}
              onArchive={handleArchive}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Spacer for sticky button */}
      <div className="h-16" />

      {/* Sticky nuevo button */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 safe-area-pb">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onCreateEvent}
            className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            <span className="inline-flex items-center gap-1.5">
              <commonIcons.plus className="h-4 w-4" aria-hidden="true" />
              Nuevo evento
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
