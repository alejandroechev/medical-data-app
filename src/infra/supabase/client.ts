import { createClient } from '@supabase/supabase-js';

declare const process: { env: Record<string, string | undefined> } | undefined;

function getEnvVar(name: string): string {
  // Vite environment (browser)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string>)[name] ?? '';
  }
  // Node.js environment (CLI)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] ?? '';
  }
  return '';
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Advertencia: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no configuradas. Algunas funciones no estarán disponibles.'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

