-- Migration: Add patient_drugs table (first-class treatments)
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS patient_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES family_members(id),
  event_id UUID REFERENCES medical_events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  schedule JSONB NOT NULL,  -- {"type":"interval","intervalHours":8} or {"type":"fixed","times":["08:00","20:00"]}
  duration JSONB NOT NULL,  -- {"type":"days","days":7} or {"type":"indefinite"}
  start_date DATE NOT NULL,
  start_time TEXT,  -- HH:mm format, time of first dose
  end_date DATE,
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  next_pickup_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_drugs_patient ON patient_drugs(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_drugs_event ON patient_drugs(event_id);
CREATE INDEX IF NOT EXISTS idx_patient_drugs_status ON patient_drugs(status);

-- RLS for patient_drugs
ALTER TABLE patient_drugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read patient_drugs" ON patient_drugs FOR SELECT USING (true);
CREATE POLICY "Public insert patient_drugs" ON patient_drugs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update patient_drugs" ON patient_drugs FOR UPDATE USING (true);
CREATE POLICY "Public delete patient_drugs" ON patient_drugs FOR DELETE USING (true);

-- Remove isPermanent/nextPickupDate from medical_events (moved to patient_drugs)
ALTER TABLE medical_events DROP COLUMN IF EXISTS is_permanent;
ALTER TABLE medical_events DROP COLUMN IF EXISTS next_pickup_date;
