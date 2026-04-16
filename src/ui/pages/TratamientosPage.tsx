import { useState, useEffect, useCallback } from 'react';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { listPatientDrugsByPatient, createPatientDrug, updatePatientDrug, deletePatientDrug } from '../../infra/store-provider';
import { DrugCard } from '../components/DrugCard';
import { DrugForm } from '../components/DrugForm';
import type { PatientDrug, CreatePatientDrugInput, UpdatePatientDrugInput } from '../../domain/models/prescription-drug';
import { commonIcons } from '../components/icons';

type FilterStatus = 'active' | 'all' | 'stopped';

export function TratamientosPage({ initialPatientId }: { initialPatientId?: string }) {
  const members = getFamilyMembers();
  const [selectedPatient, setSelectedPatient] = useState(initialPatientId ?? members[0]?.id ?? '');
  const [drugs, setDrugs] = useState<PatientDrug[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');

  const loadDrugs = useCallback(async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const data = await listPatientDrugsByPatient(selectedPatient);
      setDrugs(data);
    } finally {
      setLoading(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    loadDrugs();
  }, [loadDrugs]);

  const handleAddDrug = async (input: CreatePatientDrugInput) => {
    await createPatientDrug(input);
    setShowForm(false);
    await loadDrugs();
  };

  const handleEditDrug = async (id: string, input: UpdatePatientDrugInput) => {
    await updatePatientDrug(id, input);
    await loadDrugs();
  };

  const handleStopDrug = async (id: string) => {
    await updatePatientDrug(id, { status: 'stopped', endDate: new Date().toISOString().split('T')[0] });
    await loadDrugs();
  };

  const handleDeleteDrug = async (id: string) => {
    await deletePatientDrug(id);
    await loadDrugs();
  };

  const filteredDrugs = drugs.filter((d) => {
    if (filterStatus === 'active') return d.status === 'active';
    if (filterStatus === 'stopped') return d.status === 'stopped' || d.status === 'completed';
    return true;
  });

  const patientName = members.find((m) => m.id === selectedPatient)?.name;

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Patient selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
        <div>
          <label htmlFor="tratamiento-paciente" className="block text-xs text-gray-500 mb-1">Paciente</label>
          <select
            id="tratamiento-paciente"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {(['active', 'all', 'stopped'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                filterStatus === s
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {s === 'active' ? 'Activos' : s === 'all' ? 'Todos' : 'Finalizados'}
            </button>
          ))}
        </div>
      </div>

      {/* Drug list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            {filteredDrugs.length} tratamiento{filteredDrugs.length !== 1 ? 's' : ''}
          </p>

          {filteredDrugs.length === 0 && !showForm && (
            <div className="text-center py-8">
              <commonIcons.treatments className="h-8 w-8 mx-auto text-gray-400" aria-hidden="true" />
              <p className="text-gray-400 text-sm mt-2">
                {filterStatus === 'active'
                  ? `${patientName} no tiene tratamientos activos`
                  : 'Sin tratamientos registrados'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {filteredDrugs.map((drug) => (
              <DrugCard
                key={drug.id}
                drug={drug}
                onEdit={handleEditDrug}
                onStop={handleStopDrug}
                onDelete={handleDeleteDrug}
              />
            ))}
          </div>
        </>
      )}

      {/* Add form */}
      {showForm ? (
        <DrugForm
          patientId={selectedPatient}
          onSubmit={handleAddDrug}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <span className="inline-flex items-center gap-1.5">
            <commonIcons.plus className="h-4 w-4" aria-hidden="true" />
            Nuevo tratamiento
          </span>
        </button>
      )}
    </div>
  );
}
