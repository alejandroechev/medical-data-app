import { useState, useMemo, useEffect } from 'react';
import { useEvents } from '../hooks/useEventos';
import { EventCard } from '../components/EventCard';
import { ExpenseSummary } from '../components/ExpenseSummary';
import { EVENT_TYPES, REIMBURSEMENT_STATUSES } from '../../domain/models/medical-event';
import type { ReimbursementStatus } from '../../domain/models/medical-event';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { listProfessionals, listLocations, listPrescriptionDrugsByEvent, listAllPrescriptionDrugs } from '../../infra/store-provider';
import type { MedicalEventFilters } from '../../domain/services/medical-event-repository';
import type { Professional, Location } from '../../domain/models/professional-location';
import type { PrescriptionDrug } from '../../domain/models/prescription-drug';

const STATUS_LABELS: Record<ReimbursementStatus, string> = {
  none: 'Sin solicitar',
  requested: 'Solicitado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

interface HistorialPageProps {
  onEventClick: (id: string) => void;
}

export function HistorialPage({ onEventClick }: HistorialPageProps) {
  const members = getFamilyMembers();
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isapreStatus, setIsapreStatus] = useState('');
  const [insuranceStatus, setInsuranceStatus] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [drugName, setDrugName] = useState('');
  const [knownDrugNames, setKnownDrugNames] = useState<string[]>([]);
  const [drugMap, setDrugMap] = useState<Map<string, PrescriptionDrug[]>>(new Map());
  const [drugFilterLoading, setDrugFilterLoading] = useState(false);

  useEffect(() => {
    listProfessionals().then(setProfessionals);
    listLocations().then(setLocations);
    listAllPrescriptionDrugs().then((drugs) => {
      const names = [...new Set(drugs.map((d) => d.name))].sort();
      setKnownDrugNames(names);
    });
  }, []);

  const filters: MedicalEventFilters = useMemo(
    () => ({
      patientId: patientId || undefined,
      type: type || undefined,
      from: from || undefined,
      to: to || undefined,
      isapreReimbursementStatus: (isapreStatus || undefined) as ReimbursementStatus | undefined,
      insuranceReimbursementStatus: (insuranceStatus || undefined) as ReimbursementStatus | undefined,
      professionalId: professionalId || undefined,
      locationId: locationId || undefined,
    }),
    [patientId, type, from, to, isapreStatus, insuranceStatus, professionalId, locationId]
  );

  const { events, loading, error } = useEvents(filters);

  // Load drugs for Receta events when drug filter is active
  useEffect(() => {
    if (!drugName) {
      setDrugMap(new Map());
      return;
    }
    const recetaEvents = events.filter((e) => e.type === 'Receta');
    if (recetaEvents.length === 0) {
      setDrugMap(new Map());
      return;
    }
    setDrugFilterLoading(true);
    Promise.all(
      recetaEvents.map(async (e) => {
        const drugs = await listPrescriptionDrugsByEvent(e.id);
        return [e.id, drugs] as [string, PrescriptionDrug[]];
      })
    ).then((entries) => {
      setDrugMap(new Map(entries));
      setDrugFilterLoading(false);
    });
  }, [drugName, events]);

  const filteredEvents = useMemo(() => {
    if (!drugName) return events;
    return events.filter((e) => {
      if (e.type !== 'Receta') return false;
      const drugs = drugMap.get(e.id) ?? [];
      return drugs.some((d) => d.name === drugName);
    });
  }, [events, drugName, drugMap]);

  const isLoading = loading || drugFilterLoading;

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const today = formatDate(new Date());

  const presets = [
    { label: 'Última semana', days: 7 },
    { label: 'Último mes', days: 30 },
    { label: 'Último año', days: 365 },
  ] as const;

  const isPresetActive = (days: number) => {
    const expectedFrom = formatDate(new Date(Date.now() - days * 86400000));
    return from === expectedFrom && to === today;
  };

  const applyPreset = (days: number) => {
    setFrom(formatDate(new Date(Date.now() - days * 86400000)));
    setTo(today);
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">Filtros</h2>

        <div className="flex gap-2">
          {presets.map((p) => (
            <button
              key={p.days}
              onClick={() => applyPreset(p.days)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isPresetActive(p.days)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="filtro-paciente" className="block text-xs text-gray-500 mb-1">Paciente</label>
            <select
              id="filtro-paciente"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
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
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-desde" className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              id="filtro-desde"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="filtro-hasta" className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              id="filtro-hasta"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="filtro-isapre" className="block text-xs text-gray-500 mb-1">ISAPRE</label>
            <select
              id="filtro-isapre"
              value={isapreStatus}
              onChange={(e) => setIsapreStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {REIMBURSEMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-seguro" className="block text-xs text-gray-500 mb-1">Seguro</label>
            <select
              id="filtro-seguro"
              value={insuranceStatus}
              onChange={(e) => setInsuranceStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {REIMBURSEMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-profesional" className="block text-xs text-gray-500 mb-1">Profesional</label>
            <select
              id="filtro-profesional"
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.specialty ? `${p.name} (${p.specialty})` : p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-lugar" className="block text-xs text-gray-500 mb-1">Lugar</label>
            <select
              id="filtro-lugar"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label htmlFor="filtro-medicamento" className="block text-xs text-gray-500 mb-1">Medicamento</label>
            <select
              id="filtro-medicamento"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {knownDrugNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expense summary for filtered results */}
      {!isLoading && !error && <ExpenseSummary events={filteredEvents} />}

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">Buscando...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <p className="text-xs text-gray-400">
            {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {filteredEvents.map((evento) => (
              <EventCard key={evento.id} evento={evento} onClick={onEventClick} />
            ))}
          </div>
          {filteredEvents.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              No se encontraron eventos con los filtros seleccionados
            </p>
          )}
        </>
      )}
    </div>
  );
}
