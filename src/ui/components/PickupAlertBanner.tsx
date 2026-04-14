import type { PickupAlert } from '../../domain/models/pickup-notification';
import { alertKey } from '../../domain/models/pickup-notification';
import { commonIcons, type AppIcon } from './icons';

interface PickupAlertBannerProps {
  alerts: PickupAlert[];
  onDismiss: (key: string) => void;
  patientNames?: Map<string, string>;
}

const LEVEL_STYLES: Record<PickupAlert['level'], { bg: string; icon: AppIcon; label: (days: number) => string }> = {
  reminder: {
    bg: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: commonIcons.clipboard,
    label: (days) => `En ${days} día${days !== 1 ? 's' : ''}`,
  },
  due: {
    bg: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    icon: commonIcons.clock,
    label: () => 'Hoy',
  },
  overdue: {
    bg: 'bg-red-50 border-red-200 text-red-800',
    icon: commonIcons.danger,
    label: () => 'Atrasado',
  },
};

export function PickupAlertBanner({ alerts, onDismiss, patientNames }: PickupAlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 p-4 pb-0">
      {alerts.map((alert) => {
        const style = LEVEL_STYLES[alert.level];
        const AlertIcon = style.icon;
        const key = alertKey(alert);
        const patient = patientNames?.get(alert.patientId);

        return (
          <div
            key={key}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${style.bg}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <AlertIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {style.label(alert.daysUntilPickup)}: retiro de{' '}
              <strong>{alert.drugName}</strong>
              {patient && <span> — {patient}</span>}
              </span>
            </span>
            <button
              onClick={() => onDismiss(key)}
              className="ml-2 text-xs opacity-60 hover:opacity-100"
              aria-label="Cerrar alerta"
            >
              <commonIcons.close className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
