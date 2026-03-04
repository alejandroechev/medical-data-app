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
const BUCKET = 'event-photos';

async function listAllFiles(prefix = ''): Promise<string[]> {
  const paths: string[] = [];
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 });

  if (error) {
    console.warn(`Warning: Could not list ${prefix}: ${error.message}`);
    return paths;
  }

  for (const item of data ?? []) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      // It's a file
      paths.push(fullPath);
    } else {
      // It's a folder, recurse
      const subPaths = await listAllFiles(fullPath);
      paths.push(...subPaths);
    }
  }

  return paths;
}

async function downloadFile(path: string): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(path);

  if (error) {
    console.warn(`Warning: Could not download ${path}: ${error.message}`);
    return null;
  }

  return new Uint8Array(await data.arrayBuffer());
}

async function main() {
  const date = new Date().toISOString().split('T')[0];
  const outputDir = join('backups', date, 'files');

  console.log('Listing all files in bucket...');
  const files = await listAllFiles();
  console.log(`Found ${files.length} files`);

  if (files.length === 0) {
    console.log('No files to backup.');
    return;
  }

  let downloaded = 0;
  let failed = 0;

  for (const filePath of files) {
    const localPath = join(outputDir, filePath);
    const dir = localPath.substring(0, localPath.lastIndexOf('/'));

    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const content = await downloadFile(filePath);
    if (content) {
      writeFileSync(localPath, content);
      downloaded++;
      console.log(`  ✓ ${filePath} (${(content.length / 1024).toFixed(1)} KB)`);
    } else {
      failed++;
    }
  }

  console.log(`\nBackup complete: ${downloaded} downloaded, ${failed} failed`);
}

main().catch((err) => {
  console.error('File backup failed:', err);
  process.exit(1);
});
