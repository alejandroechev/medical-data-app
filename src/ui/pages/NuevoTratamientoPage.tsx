import { useState } from 'react';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { createPatientDrug } from '../../infra/store-provider';
import { DrugForm } from '../components/DrugForm';
import type { CreatePatientDrugInput } from '../../domain/models/prescription-drug';

interface NuevoTratamientoPageProps {
  onCreated: () => void;
  initialPatientId?: string;
}

export function NuevoTratamientoPage({ onCreated, initialPatientId }: NuevoTratamientoPageProps) {
  const members = getFamilyMembers();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (input: CreatePatientDrugInput) => {
    await createPatientDrug(input);
    setSuccess(true);
    setTimeout(() => onCreated(), 1500);
  };

  if (success) {
    return (
      <div className="p-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 text-sm font-medium">Tratamiento creado exitosamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <DrugForm
        patientId={initialPatientId || members[0]?.id || ''}
        onSubmit={handleSubmit}
        onCancel={onCreated}
        showPatientSelector={!initialPatientId}
        members={members}
      />
    </div>
  );
}
