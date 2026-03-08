-- Migration: Add RPC function for table discovery (used by backup script)
-- Run this in Supabase SQL editor

CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE(table_name text) AS $$
  SELECT tablename::text AS table_name
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$ LANGUAGE sql SECURITY DEFINER;
