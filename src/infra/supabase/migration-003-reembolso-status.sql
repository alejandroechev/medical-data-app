-- Migration: Convert reembolso fields from boolean to status enum
-- Run this in Supabase SQL editor to migrate existing data

-- Step 1: Add new status columns
ALTER TABLE medical_events 
  ADD COLUMN IF NOT EXISTS reembolso_isapre_status TEXT NOT NULL DEFAULT 'none'
  CHECK (reembolso_isapre_status IN ('none', 'requested', 'approved', 'rejected'));

ALTER TABLE medical_events 
  ADD COLUMN IF NOT EXISTS reembolso_seguro_status TEXT NOT NULL DEFAULT 'none'
  CHECK (reembolso_seguro_status IN ('none', 'requested', 'approved', 'rejected'));

-- Step 2: Migrate existing boolean data to status values
UPDATE medical_events 
  SET reembolso_isapre_status = CASE WHEN reembolso_isapre THEN 'approved' ELSE 'none' END
  WHERE reembolso_isapre IS NOT NULL;

UPDATE medical_events 
  SET reembolso_seguro_status = CASE WHEN reembolso_seguro THEN 'approved' ELSE 'none' END
  WHERE reembolso_seguro IS NOT NULL;

-- Step 3: Drop old boolean columns
ALTER TABLE medical_events DROP COLUMN IF EXISTS reembolso_isapre;
ALTER TABLE medical_events DROP COLUMN IF EXISTS reembolso_seguro;
