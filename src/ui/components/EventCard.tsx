import type { MedicalEvent, ReimbursementStatus } from '../../domain/models/medical-event';
import { getFamilyMemberById } from '../../infra/supabase/family-member-store';
import { getMemberColor } from '../../domain/models/family-member';

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
  'Receta': '💊',
  'Otro': '📋',
};

const BADGE_STYLES: Record<ReimbursementStatus, string> = {
  none: '',
  requested: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const BADGE_LABELS: Record<ReimbursementStatus, string> = {
  none: '',
  requested: '⏳',
  approved: '✓',
  rejected: '✗',
};

export function EventCard({ evento, onClick }: EventCardProps) {
  const paciente = getFamilyMemberById(evento.patientId);
  const icon = TYPE_ICONS[evento.type] ?? '📋';
  const memberColor = getMemberColor(paciente?.name ?? '');

  return (
    <button
      onClick={() => onClick(evento.id)}
      className={`w-full text-left bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
        evento.isArchived ? 'border-amber-100 opacity-75' : 'border-gray-100'
      }`}
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
            <span className={`text-xs px-2 py-0.5 rounded-full ${memberColor}`}>
              {paciente?.name ?? 'Desconocido'}
            </span>
            {evento.cost != null && evento.cost > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                ${evento.cost.toLocaleString('es-CL')}
              </span>
            )}
            {evento.isArchived && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                📦 Archivado
              </span>
            )}
            {evento.isapreReimbursementStatus !== 'none' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${BADGE_STYLES[evento.isapreReimbursementStatus]}`}>
                ISAPRE {BADGE_LABELS[evento.isapreReimbursementStatus]}
              </span>
            )}
            {evento.insuranceReimbursementStatus !== 'none' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${BADGE_STYLES[evento.insuranceReimbursementStatus]}`}>
                Seguro {BADGE_LABELS[evento.insuranceReimbursementStatus]}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
