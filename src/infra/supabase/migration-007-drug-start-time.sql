-- Migration: Add start_time to patient_drugs
-- Run this in Supabase SQL editor

ALTER TABLE patient_drugs ADD COLUMN IF NOT EXISTS start_time TEXT;
-- HH:mm format, time of first dose (affects treatment duration calculation)
