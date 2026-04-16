import type { Page } from '../hooks/useNavigation';
import { commonIcons, type AppIcon } from './icons';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const tabs: { page: Page; label: string; icon: AppIcon }[] = [
    { page: 'inicio', label: 'Inicio', icon: commonIcons.home },
    { page: 'eventos', label: 'Eventos', icon: commonIcons.clipboard },
    { page: 'tratamientos', label: 'Tratamientos', icon: commonIcons.treatments },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.page}
            onClick={() => onNavigate(tab.page)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentPage === tab.page
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-label={tab.label}
          >
            <tab.icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
