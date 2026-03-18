import { useEffect, useState } from 'react';
import { useNavigation } from './ui/hooks/useNavigation';
import { usePickupAlerts } from './ui/hooks/usePickupAlerts';
import { Header } from './ui/components/Header';
import { BottomNav } from './ui/components/BottomNav';
import { PinGate } from './ui/components/PinGate';
import { PickupAlertBanner } from './ui/components/PickupAlertBanner';
import { InicioPage } from './ui/pages/InicioPage';
import { NuevoEventoPage } from './ui/pages/NuevoEventoPage';
import { DetalleEventoPage } from './ui/pages/DetalleEventoPage';
import { HistorialPage } from './ui/pages/HistorialPage';
import { TratamientosPage } from './ui/pages/TratamientosPage';
import { loadFamilyMembers } from './infra/supabase/family-member-store';

const PAGE_TITLES: Record<string, string> = {
  'inicio': 'Registro Médico Familiar',
  'nuevo-evento': 'Nuevo Evento',
  'detalle-evento': 'Detalle del Evento',
  'historial': 'Historial',
  'tratamientos': 'Tratamientos',
};

function App() {
  const { currentPage, params, navigateTo, goBack } = useNavigation();
  const { visibleAlerts, patientNames, dismissAlert } = usePickupAlerts();
  const [ready, setReady] = useState(false);
  const showBack = currentPage !== 'inicio';
  const title = PAGE_TITLES[currentPage] ?? 'Registro Médico';

  useEffect(() => {
    loadFamilyMembers().then(() => setReady(true));
  }, []);

  const handleEventClick = (id: string) => {
    navigateTo('detalle-evento', { eventoId: id });
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <PinGate>
      <div className="min-h-screen bg-gray-50">
        <Header titulo={title} onBack={showBack ? goBack : undefined} />

        <PickupAlertBanner
          alerts={visibleAlerts}
          onDismiss={dismissAlert}
          patientNames={patientNames}
        />

        <main className="max-w-lg mx-auto pb-20">
          {currentPage === 'inicio' && (
            <InicioPage
              onEventClick={handleEventClick}
              onViewPatientHistory={(patientId) => navigateTo('historial', { patientId })}
            />
          )}
          {currentPage === 'nuevo-evento' && (
            <NuevoEventoPage onCreated={() => navigateTo('inicio')} />
          )}
          {currentPage === 'detalle-evento' && params.eventoId && (
            <DetalleEventoPage
              eventoId={params.eventoId}
              onDeleted={() => navigateTo('inicio')}
              onDuplicated={(id) => navigateTo('detalle-evento', { eventoId: id })}
            />
          )}
          {currentPage === 'historial' && (
            <HistorialPage onEventClick={handleEventClick} initialPatientId={params.patientId} />
          )}
          {currentPage === 'tratamientos' && (
            <TratamientosPage />
          )}
        </main>

        <BottomNav currentPage={currentPage} onNavigate={navigateTo} />
      </div>
    </PinGate>
  );
}

export default App;
