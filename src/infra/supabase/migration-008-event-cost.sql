-- Migration: Add cost field to medical_events
-- Run this in Supabase SQL editor

ALTER TABLE medical_events ADD COLUMN IF NOT EXISTS costo INTEGER;
