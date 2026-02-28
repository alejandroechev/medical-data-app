import type { MedicalEvent } from '../../domain/models/medical-event';
import { getFamilyMemberById } from '../../infra/supabase/family-member-store';

interface EventCardProps {
  evento: MedicalEvent;
  onClick: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  'Consulta Médica': '🩺',
  'Consulta Dental': '🦷',
  'Urgencia': '🚑',
  'Cirugía': '🏥',
  'Examen': '🔬',
  'Otro': '📋',
};

export function EventCard({ evento, onClick }: EventCardProps) {
  const paciente = getFamilyMemberById(evento.patientId);
  const icon = TYPE_ICONS[evento.type] ?? '📋';

  return (
    <button
      onClick={() => onClick(evento.id)}
      className="w-full text-left bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-label={evento.type}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">{evento.type}</span>
            <span className="text-xs text-gray-500">{evento.date}</span>
          </div>
          <p className="text-sm text-gray-800 mt-1 line-clamp-2">{evento.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {paciente?.name ?? 'Desconocido'}
            </span>
            {evento.isapreReimbursed && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ISAPRE ✓
              </span>
            )}
            {evento.insuranceReimbursed && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Seguro ✓
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
