-- Registro Médico Familiar - Supabase Schema
-- Run this in your Supabase SQL editor to set up the database

-- Tabla: miembros de familia (datos semilla, no CRUD)
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  parentesco TEXT NOT NULL
);

-- Tabla: eventos médicos
CREATE TABLE IF NOT EXISTS medical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'Consulta Médica', 'Consulta Dental', 'Urgencia', 'Cirugía', 'Examen', 'Otro'
  )),
  descripcion TEXT NOT NULL,
  paciente_id UUID NOT NULL REFERENCES family_members(id),
  reembolso_isapre BOOLEAN NOT NULL DEFAULT FALSE,
  reembolso_seguro BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: fotos vinculadas a eventos
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES medical_events(id) ON DELETE CASCADE,
  google_photos_url TEXT NOT NULL,
  google_photos_id TEXT NOT NULL,
  descripcion TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_events_paciente ON medical_events(paciente_id);
CREATE INDEX IF NOT EXISTS idx_events_fecha ON medical_events(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_events_tipo ON medical_events(tipo);
CREATE INDEX IF NOT EXISTS idx_photos_evento ON event_photos(evento_id);

-- Trigger para actualizar actualizado_en automáticamente
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_medical_events
  BEFORE UPDATE ON medical_events
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- Desactivar RLS (app sin autenticación, acceso abierto)
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso abierto (sin auth)
CREATE POLICY "Acceso público lectura family_members" ON family_members FOR SELECT USING (true);
CREATE POLICY "Acceso público lectura medical_events" ON medical_events FOR SELECT USING (true);
CREATE POLICY "Acceso público inserción medical_events" ON medical_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualización medical_events" ON medical_events FOR UPDATE USING (true);
CREATE POLICY "Acceso público eliminación medical_events" ON medical_events FOR DELETE USING (true);
CREATE POLICY "Acceso público lectura event_photos" ON event_photos FOR SELECT USING (true);
CREATE POLICY "Acceso público inserción event_photos" ON event_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público eliminación event_photos" ON event_photos FOR DELETE USING (true);
