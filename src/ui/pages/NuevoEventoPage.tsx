import { useState } from 'react';
import { EventForm } from '../components/EventForm';
import type { CreateMedicalEventInput } from '../../domain/models/medical-event';
import { createEvent } from '../../infra/store-provider';
import { commonIcons } from '../components/icons';

interface NuevoEventoPageProps {
  onCreated: () => void;
}

export function NuevoEventoPage({ onCreated }: NuevoEventoPageProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (input: CreateMedicalEventInput) => {
    setLoading(true);
    setSuccess(false);
    try {
      await createEvent(input);
      setSuccess(true);
      setTimeout(() => {
        onCreated();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="inline-flex items-center gap-1.5 text-sm text-green-600">
            <commonIcons.check className="h-4 w-4" aria-hidden="true" />
            Evento creado exitosamente
          </p>
        </div>
      )}
      <EventForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
