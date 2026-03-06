-- Migration: Add Receta support (parent event, permanent flag, next pickup date)
-- Run this in Supabase SQL editor

-- Update tipo CHECK constraint to include 'Receta'
ALTER TABLE medical_events DROP CONSTRAINT IF EXISTS medical_events_tipo_check;
ALTER TABLE medical_events ADD CONSTRAINT medical_events_tipo_check CHECK (tipo IN (
  'Consulta Médica', 'Consulta Dental', 'Urgencia', 'Cirugía', 'Examen', 'Receta', 'Otro'
));

-- Add parent event reference
ALTER TABLE medical_events ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES medical_events(id);

-- Add permanent prescription flag
ALTER TABLE medical_events ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN NOT NULL DEFAULT FALSE;

-- Add next pickup date for permanent prescriptions
ALTER TABLE medical_events ADD COLUMN IF NOT EXISTS next_pickup_date DATE;

-- Index for parent event lookups
CREATE INDEX IF NOT EXISTS idx_events_parent ON medical_events(parent_event_id);
