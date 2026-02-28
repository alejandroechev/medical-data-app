import { useNavigation } from './ui/hooks/useNavigation';
import { Header } from './ui/components/Header';
import { BottomNav } from './ui/components/BottomNav';
import { InicioPage } from './ui/pages/InicioPage';
import { NuevoEventoPage } from './ui/pages/NuevoEventoPage';
import { DetalleEventoPage } from './ui/pages/DetalleEventoPage';
import { HistorialPage } from './ui/pages/HistorialPage';

const PAGE_TITLES: Record<string, string> = {
  'inicio': 'Registro Médico Familiar',
  'nuevo-evento': 'Nuevo Evento',
  'detalle-evento': 'Detalle del Evento',
  'historial': 'Historial',
};

function App() {
  const { currentPage, params, navigateTo, goBack } = useNavigation();
  const showBack = currentPage !== 'inicio';
  const title = PAGE_TITLES[currentPage] ?? 'Registro Médico';

  const handleEventClick = (id: string) => {
    navigateTo('detalle-evento', { eventoId: id });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo={title} onBack={showBack ? goBack : undefined} />

      <main className="max-w-lg mx-auto pb-20">
        {currentPage === 'inicio' && (
          <InicioPage onEventClick={handleEventClick} />
        )}
        {currentPage === 'nuevo-evento' && (
          <NuevoEventoPage onCreated={() => navigateTo('inicio')} />
        )}
        {currentPage === 'detalle-evento' && params.eventoId && (
          <DetalleEventoPage eventoId={params.eventoId} />
        )}
        {currentPage === 'historial' && (
          <HistorialPage onEventClick={handleEventClick} />
        )}
      </main>

      <BottomNav currentPage={currentPage} onNavigate={navigateTo} />
    </div>
  );
}

export default App;
