import { useEffect, useState } from 'react';
import { useNavigation } from './ui/hooks/useNavigation';
import { usePickupAlerts } from './ui/hooks/usePickupAlerts';
import { Header } from './ui/components/Header';
import { AppInfo } from './ui/components/AppInfo';
import { BottomNav } from './ui/components/BottomNav';
import { PinGate } from './ui/components/PinGate';
import { SyncAuthGate } from './ui/components/SyncAuthGate';
import { UpdateBanner } from './ui/components/UpdateBanner';
import { PickupAlertBanner } from './ui/components/PickupAlertBanner';
import { InicioPage } from './ui/pages/InicioPage';
import { NuevoEventoPage } from './ui/pages/NuevoEventoPage';
import { DetalleEventoPage } from './ui/pages/DetalleEventoPage';
import { EventosPage } from './ui/pages/EventosPage';
import { TratamientosPage } from './ui/pages/TratamientosPage';
import { DetalleTratamientoPage } from './ui/pages/DetalleTratamientoPage';
import { loadFamilyMembers } from './infra/supabase/family-member-store';

const PAGE_TITLES: Record<string, string> = {
  'inicio': 'Registro Médico Familiar',
  'eventos': 'Eventos',
  'nuevo-evento': 'Nuevo Evento',
  'detalle-evento': 'Detalle del Evento',
  'tratamientos': 'Tratamientos',
  'detalle-tratamiento': 'Detalle del Tratamiento',
};

function App() {
  const { currentPage, params, navigateTo, goBack } = useNavigation();
  const { visibleAlerts, patientNames, dismissAlert } = usePickupAlerts();
  const [ready, setReady] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
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
    <SyncAuthGate>
    <PinGate>
      <div className="min-h-screen bg-gray-50">
        <Header
          titulo={title}
          onBack={showBack ? goBack : undefined}
          onInfoToggle={() => setShowInfo((current) => !current)}
        />

        {showInfo && <AppInfo />}

        <UpdateBanner />

        <PickupAlertBanner
          alerts={visibleAlerts}
          onDismiss={dismissAlert}
          patientNames={patientNames}
        />

        <main className="max-w-lg mx-auto pb-24">
          {currentPage === 'inicio' && (
            <InicioPage
              onViewPatientHistory={(patientId) => navigateTo('eventos', { patientId })}
              onViewPatientTreatments={(patientId) => navigateTo('tratamientos', { patientId })}
            />
          )}
          {currentPage === 'eventos' && (
            <EventosPage
              onEventClick={handleEventClick}
              onCreateEvent={() => navigateTo('nuevo-evento')}
              initialPatientId={params.patientId}
            />
          )}
          {currentPage === 'nuevo-evento' && (
            <NuevoEventoPage onCreated={() => navigateTo('eventos')} />
          )}
          {currentPage === 'detalle-evento' && params.eventoId && (
            <DetalleEventoPage eventoId={params.eventoId} />
          )}
          {currentPage === 'tratamientos' && (
            <TratamientosPage
              initialPatientId={params.patientId}
              onDrugClick={(id) => navigateTo('detalle-tratamiento', { drugId: id })}
            />
          )}
          {currentPage === 'detalle-tratamiento' && params.drugId && (
            <DetalleTratamientoPage drugId={params.drugId} />
          )}
        </main>

        <BottomNav currentPage={currentPage} onNavigate={navigateTo} />
      </div>
    </PinGate>
    </SyncAuthGate>
  );
}

export default App;
