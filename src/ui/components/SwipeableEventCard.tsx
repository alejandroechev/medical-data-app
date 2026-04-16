import { useRef, useState, useCallback, useEffect } from 'react';
import { EventCard } from './EventCard';
import { commonIcons } from './icons';
import type { MedicalEvent } from '../../domain/models/medical-event';

const ACTION_PANEL_WIDTH = 180;
const SWIPE_THRESHOLD = 60;

interface SwipeableEventCardProps {
  evento: MedicalEvent;
  onClick: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

export function SwipeableEventCard({ evento, onClick, onArchive, onDuplicate }: SwipeableEventCardProps) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });

  const close = useCallback(() => {
    setOffset(0);
    setRevealed(false);
  }, []);

  // Close context menu on outside click or scroll
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

    if (revealed) {
      // Allow swiping back when already revealed
      const newOffset = Math.max(0, Math.min(ACTION_PANEL_WIDTH, ACTION_PANEL_WIDTH + delta));
      setOffset(newOffset);
    } else {
      // Only allow right-swipe (positive delta), capped at panel width
      const newOffset = Math.max(0, Math.min(ACTION_PANEL_WIDTH, delta));
      setOffset(newOffset);
    }
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
    if (revealed) {
      close();
      return;
    }
    onClick(id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const handleArchive = () => {
    close();
    setContextMenu(prev => ({ ...prev, visible: false }));
    onArchive(evento.id);
  };

  const handleDuplicate = () => {
    close();
    setContextMenu(prev => ({ ...prev, visible: false }));
    onDuplicate(evento.id);
  };

  const ArchiveIcon = commonIcons.archive;
  const CopyIcon = commonIcons.copy;

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      data-testid="swipeable-event-card"
      onContextMenu={handleContextMenu}
    >
      {/* Action panel behind the card */}
      <div
        className="absolute inset-y-0 left-0 flex"
        style={{ width: ACTION_PANEL_WIDTH }}
        data-testid="action-panel"
      >
        <button
          onClick={handleArchive}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-amber-600 text-white active:bg-amber-700"
          data-testid="action-archive"
        >
          <ArchiveIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium">Archivar</span>
        </button>
        <button
          onClick={handleDuplicate}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-blue-500 text-white active:bg-blue-600"
          data-testid="action-duplicate"
        >
          <CopyIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium">Copiar</span>
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
        data-testid="swipeable-card-wrapper"
      >
        <EventCard evento={evento} onClick={handleCardClick} />
      </div>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          data-testid="context-menu"
        >
          <button
            onClick={handleArchive}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            data-testid="context-menu-archive"
          >
            <ArchiveIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />
            Archivar
          </button>
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            data-testid="context-menu-duplicate"
          >
            <CopyIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Copiar
          </button>
        </div>
      )}
    </div>
  );
}
