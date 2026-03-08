import { useState, useEffect } from 'react';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { listEvents, listActivePatientDrugs } from '../../infra/store-provider';
import { getMemberColor } from '../../domain/models/family-member';
import type { PatientDrug } from '../../domain/models/prescription-drug';
import { formatSchedule } from '../../domain/models/prescription-drug';
import type { FamilyMember } from '../../domain/models/family-member';

interface MemberSummary {
  member: FamilyMember;
  totalEvents: number;
  activeDrugs: PatientDrug[];
  pendingIsapre: number;
  pendingInsurance: number;
  totalCost: number;
  reimbursedCost: number;
}

interface FamilySummaryProps {
  onViewHistory?: (patientId: string) => void;
}

export function FamilySummary({ onViewHistory }: FamilySummaryProps) {
  const members = getFamilyMembers();
  const [summaries, setSummaries] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [events, activeDrugs] = await Promise.all([
        listEvents(),
        listActivePatientDrugs(),
      ]);

      const data = members.map((member) => {
        const memberEvents = events.filter((e) => e.patientId === member.id);
        const memberDrugs = activeDrugs.filter((d) => d.patientId === member.id);
        const pendingIsapre = memberEvents.filter((e) => e.isapreReimbursementStatus === 'requested').length;
        const pendingInsurance = memberEvents.filter((e) => e.insuranceReimbursementStatus === 'requested').length;
        const totalCost = memberEvents.reduce((sum, e) => sum + (e.cost ?? 0), 0);
        const reimbursedCost = memberEvents
          .filter((e) => e.isapreReimbursementStatus === 'approved' || e.insuranceReimbursementStatus === 'approved')
          .reduce((sum, e) => sum + (e.cost ?? 0), 0);

        return {
          member,
          totalEvents: memberEvents.length,
          activeDrugs: memberDrugs,
          pendingIsapre,
          pendingInsurance,
          totalCost,
          reimbursedCost,
        };
      });

      setSummaries(data);
      setLoading(false);
    }
    load();
  }, []);

  const notifiable = summaries.filter((s) => s.totalEvents > 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <p className="text-gray-400 text-sm text-center">Cargando resumen...</p>
      </div>
    );
  }

  if (notifiable.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Resumen familiar
      </h2>
      {notifiable.map((s) => {
        const isExpanded = expandedId === s.member.id;
        const color = getMemberColor(s.member.name);
        const hasPending = s.pendingIsapre > 0 || s.pendingInsurance > 0;

        return (
          <div key={s.member.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : s.member.id)}
              className="w-full text-left p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                  {s.member.name}
                </span>
                <span className="text-xs text-gray-400">{s.totalEvents} eventos</span>
                {s.activeDrugs.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    💊 {s.activeDrugs.length}
                  </span>
                )}
                {hasPending && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    ⏳ {s.pendingIsapre + s.pendingInsurance}
                  </span>
                )}
              </div>
              <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-3 space-y-2 bg-gray-50">
                {/* Expenses */}
                {s.totalCost > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Gasto total</p>
                      <p className="text-sm font-semibold text-gray-800">${s.totalCost.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Reembolsado</p>
                      <p className="text-sm font-semibold text-green-700">${s.reimbursedCost.toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                )}

                {/* Pending reembolsos */}
                {hasPending && (
                  <div className="bg-yellow-50 rounded-lg p-2">
                    <p className="text-xs font-medium text-yellow-700">Reembolsos pendientes</p>
                    {s.pendingIsapre > 0 && <p className="text-xs text-yellow-600">ISAPRE: {s.pendingIsapre}</p>}
                    {s.pendingInsurance > 0 && <p className="text-xs text-yellow-600">Seguro: {s.pendingInsurance}</p>}
                  </div>
                )}

                {/* Active treatments */}
                {s.activeDrugs.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Tratamientos activos</p>
                    {s.activeDrugs.map((d) => (
                      <p key={d.id} className="text-xs text-gray-600 ml-2">
                        • {d.name} {d.dosage} — {formatSchedule(d.schedule)}
                      </p>
                    ))}
                  </div>
                )}

                {s.totalEvents === 0 && s.activeDrugs.length === 0 && (
                  <p className="text-xs text-gray-400 text-center">Sin actividad registrada</p>
                )}

                {onViewHistory && (
                  <button
                    onClick={() => onViewHistory(s.member.id)}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    🔍 Ver historial de {s.member.name}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
