# Supabase Migration Status

| # | File | Description | Status | Applied |
|---|------|-------------|--------|---------|
| 003 | `migration-003-reembolso-status.sql` | Boolean → status enum for reembolso fields | ✅ Applied | 2026-03-06 |
| 004 | `migration-004-receta-type.sql` | Receta event type + parent_event_id | ✅ Applied | 2026-03-07 |
| 005 | `migration-005-prescription-drugs.sql` | prescription_drugs table | ✅ Applied | 2026-03-07 |
| 006 | `migration-006-patient-drugs.sql` | patient_drugs table + drop event drug fields | ✅ Applied | 2026-03-08 |
| 007 | `migration-007-drug-start-time.sql` | Add start_time column to patient_drugs | ✅ Applied | 2026-03-08 |

## How to use

1. New migrations are created as `migration-NNN-description.sql` in `src/infra/supabase/`
2. After running a migration in Supabase SQL Editor, update this file to mark it as ✅ Applied with the date
3. Copilot: check this file before asking the user to run migrations — skip already-applied ones
