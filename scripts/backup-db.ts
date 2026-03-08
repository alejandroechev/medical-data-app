import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function discoverTables(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_public_tables');
  if (!error && data) {
    return (data as { table_name: string }[]).map((r) => r.table_name).sort();
  }
  // Fallback: query information_schema via PostgREST
  const { data: fallback, error: fallbackErr } = await supabase
    .from('information_schema.tables' as string)
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');

  if (!fallbackErr && fallback) {
    return (fallback as { table_name: string }[]).map((r) => r.table_name).sort();
  }

  console.error('Could not discover tables. Using hardcoded fallback.');
  return [
    'family_members', 'medical_events', 'event_photos', 'event_recordings',
    'professionals', 'locations', 'prescription_drugs', 'patient_drugs',
  ];
}

async function exportTable(table: string): Promise<unknown[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.warn(`Warning: Could not export ${table}: ${error.message}`);
    return [];
  }
  return data ?? [];
}

async function main() {
  const date = new Date().toISOString().split('T')[0];
  const outputDir = join('backups', date);

  if (!existsSync('backups')) mkdirSync('backups');
  if (!existsSync(outputDir)) mkdirSync(outputDir);

  console.log('Discovering tables...');
  const tables = await discoverTables();
  console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
  console.log(`Backing up to ${outputDir}/`);

  for (const table of tables) {
    const data = await exportTable(table);
    const filePath = join(outputDir, `${table}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ${table}: ${data.length} rows`);
  }

  console.log('Backup complete.');
}

main().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
