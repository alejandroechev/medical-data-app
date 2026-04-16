import { useState, useEffect } from 'react';
import { FamilySummary } from '../components/FamilySummary';
import { ExpenseSummary } from '../components/ExpenseSummary';
import { listEvents } from '../../infra/store-provider';
import type { MedicalEvent } from '../../domain/models/medical-event';

interface InicioPageProps {
  onViewPatientHistory?: (patientId: string) => void;
  onViewPatientTreatments?: (patientId: string) => void;
}

export function InicioPage({ onViewPatientHistory, onViewPatientTreatments }: InicioPageProps) {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 space-y-4">
      <FamilySummary
        onViewHistory={onViewPatientHistory}
        onViewTreatments={onViewPatientTreatments}
      />

      {!loading && <ExpenseSummary events={events} />}
    </div>
  );
}
