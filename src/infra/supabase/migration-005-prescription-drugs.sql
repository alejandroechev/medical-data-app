-- Migration: Add prescription drugs table
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS prescription_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES medical_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drugs_event ON prescription_drugs(event_id);

-- RLS for prescription_drugs
ALTER TABLE prescription_drugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read prescription_drugs" ON prescription_drugs FOR SELECT USING (true);
CREATE POLICY "Public insert prescription_drugs" ON prescription_drugs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete prescription_drugs" ON prescription_drugs FOR DELETE USING (true);
