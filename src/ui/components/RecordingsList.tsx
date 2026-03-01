import type { EventRecording } from '../../domain/models/event-recording';

interface RecordingsListProps {
  recordings: EventRecording[];
  onDelete: (id: string) => Promise<void>;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function RecordingsList({ recordings, onDelete }: RecordingsListProps) {
  if (recordings.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        Sin grabaciones
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {recordings.map((rec) => (
        <div
          key={rec.id}
          className="rounded-lg border border-gray-100 p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎙</span>
              <span className="text-sm text-gray-700">
                {rec.description ?? rec.fileName}
              </span>
              {rec.durationSeconds && (
                <span className="text-xs text-gray-400">
                  ({formatDuration(rec.durationSeconds)})
                </span>
              )}
            </div>
            <button
              onClick={() => onDelete(rec.id)}
              className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
              aria-label={`Eliminar ${rec.description ?? rec.fileName}`}
            >
              ✕
            </button>
          </div>
          <audio
            src={rec.recordingUrl}
            controls
            className="w-full h-8"
          />
        </div>
      ))}
    </div>
  );
}
