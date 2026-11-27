import fs from 'fs';
import path from 'path';
import { exec } from './index.js';

export async function runMigrations() {
  console.log('--- Starting Database Migrations ---');
  const schemaPath = path.resolve(process.cwd(), 'src/lib/db/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await exec(sql);
    console.log('✓ Successfully applied schema.sql migrations');
    return { success: true };
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  }
}

// Allow direct CLI execution: node src/lib/db/migrate.js
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      console.log('Database migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
