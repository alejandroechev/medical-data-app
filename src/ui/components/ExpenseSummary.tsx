import type { MedicalEvent } from '../../domain/models/medical-event';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { getMemberColor } from '../../domain/models/family-member';

interface ExpenseSummaryProps {
  events: MedicalEvent[];
}

export function ExpenseSummary({ events }: ExpenseSummaryProps) {
  const members = getFamilyMembers();
  const eventsWithCost = events.filter((e) => e.cost && e.cost > 0);

  if (eventsWithCost.length === 0) return null;

  const totalCost = eventsWithCost.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const approvedIsapre = eventsWithCost
    .filter((e) => e.isapreReimbursementStatus === 'approved')
    .reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const approvedInsurance = eventsWithCost
    .filter((e) => e.insuranceReimbursementStatus === 'approved')
    .reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const pendingReimbursement = eventsWithCost
    .filter((e) => e.isapreReimbursementStatus === 'requested' || e.insuranceReimbursementStatus === 'requested')
    .reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const outOfPocket = totalCost - approvedIsapre - approvedInsurance;

  // Per-patient breakdown
  const byPatient = new Map<string, number>();
  eventsWithCost.forEach((e) => {
    byPatient.set(e.patientId, (byPatient.get(e.patientId) ?? 0) + (e.cost ?? 0));
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-700">💰 Resumen de gastos</h3>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-semibold text-gray-800">${totalCost.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">De bolsillo</p>
          <p className="text-sm font-semibold text-red-700">${outOfPocket.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">ISAPRE ✓</p>
          <p className="text-sm font-semibold text-green-700">${approvedIsapre.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Seguro ✓</p>
          <p className="text-sm font-semibold text-green-700">${approvedInsurance.toLocaleString('es-CL')}</p>
        </div>
      </div>

      {pendingReimbursement > 0 && (
        <div className="bg-yellow-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Reembolso pendiente</p>
          <p className="text-sm font-semibold text-yellow-700">${pendingReimbursement.toLocaleString('es-CL')}</p>
        </div>
      )}

      {/* Per-patient breakdown */}
      {byPatient.size > 1 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Por paciente</p>
          {Array.from(byPatient.entries()).map(([patientId, amount]) => {
            const member = members.find((m) => m.id === patientId);
            const color = getMemberColor(member?.name ?? '');
            return (
              <div key={patientId} className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
                  {member?.name ?? 'Desconocido'}
                </span>
                <span className="text-xs font-medium text-gray-600">${amount.toLocaleString('es-CL')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
