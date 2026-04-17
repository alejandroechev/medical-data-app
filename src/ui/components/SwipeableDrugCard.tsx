import { useRef, useState, useCallback, useEffect } from 'react';
import { DrugCard } from './DrugCard';
import { commonIcons } from './icons';
import type { PatientDrug } from '../../domain/models/prescription-drug';

const ACTION_PANEL_WIDTH = 180;
const SWIPE_THRESHOLD = 60;

interface SwipeableDrugCardProps {
  drug: PatientDrug;
  patientName?: string;
  onClick: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onArchive: (id: string) => void;
}

export function SwipeableDrugCard({ drug, patientName, onClick, onStop, onRestart, onArchive }: SwipeableDrugCardProps) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });

  const close = useCallback(() => {
    setOffset(0);
    setRevealed(false);
  }, []);

  useEffect(() => {
    if (!contextMenu.visible) return;
    const dismiss = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', dismiss);
    document.addEventListener('scroll', dismiss, true);
    return () => {
      document.removeEventListener('click', dismiss);
      document.removeEventListener('scroll', dismiss, true);
    };
  }, [contextMenu.visible]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    currentX.current = e.touches[0].clientX;
    const delta = currentX.current - startX.current;
    const base = revealed ? ACTION_PANEL_WIDTH : 0;
    setOffset(Math.max(0, Math.min(ACTION_PANEL_WIDTH, base + delta)));
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (offset >= SWIPE_THRESHOLD) {
      setOffset(ACTION_PANEL_WIDTH);
      setRevealed(true);
    } else {
      close();
    }
  };

  const handleCardClick = (id: string) => {
    if (revealed) { close(); return; }
    onClick(id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const isActive = drug.status === 'active';

  const handleToggleStatus = () => {
    close();
    setContextMenu(prev => ({ ...prev, visible: false }));
    if (isActive) { onStop(drug.id); } else { onRestart(drug.id); }
  };

  const handleArchive = () => {
    close();
    setContextMenu(prev => ({ ...prev, visible: false }));
    onArchive(drug.id);
  };

  const ToggleIcon = isActive ? commonIcons.stopAction : commonIcons.retry;
  const toggleLabel = isActive ? 'Detener' : 'Reiniciar';
  const toggleColor = isActive ? 'bg-red-600 active:bg-red-700' : 'bg-green-600 active:bg-green-700';

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      data-testid="swipeable-drug-card"
      onContextMenu={handleContextMenu}
    >
      {/* Action panel */}
      <div
        className="absolute inset-y-0 left-0 flex"
        style={{ width: ACTION_PANEL_WIDTH }}
      >
        <button
          onClick={handleToggleStatus}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-white ${toggleColor}`}
          data-testid={isActive ? 'action-stop' : 'action-restart'}
        >
          <ToggleIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium">{toggleLabel}</span>
        </button>
        <button
          onClick={handleArchive}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-amber-600 text-white active:bg-amber-700"
          data-testid="action-archive-drug"
        >
          <commonIcons.archive className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium">Archivar</span>
        </button>
      </div>

      {/* Swipeable card */}
      <div
        className="relative z-10"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <DrugCard drug={drug} patientName={patientName} onClick={handleCardClick} />
      </div>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          data-testid="drug-context-menu"
        >
          <button
            onClick={handleToggleStatus}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ToggleIcon className={`h-4 w-4 ${isActive ? 'text-red-600' : 'text-green-600'}`} aria-hidden="true" />
            {toggleLabel}
          </button>
          <button
            onClick={handleArchive}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <commonIcons.archive className="h-4 w-4 text-amber-600" aria-hidden="true" />
            Archivar
          </button>
        </div>
      )}
    </div>
  );
}
