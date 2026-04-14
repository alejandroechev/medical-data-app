import { commonIcons } from './icons';

interface HeaderProps {
  titulo: string;
  onBack?: () => void;
  onInfoToggle?: () => void;
}

export function Header({ titulo, onBack, onInfoToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-blue-600 text-white shadow-md z-40 safe-area-pt">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-3 p-1 hover:bg-blue-700 rounded"
            aria-label="Volver"
          >
            <commonIcons.back className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <h1 className="text-lg font-semibold truncate flex-1">{titulo}</h1>
        {onInfoToggle && (
          <button
            onClick={onInfoToggle}
            className="p-1 hover:bg-blue-700 rounded text-blue-100"
            aria-label="Información de la app"
            title="Información de la app"
          >
            <commonIcons.info className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
