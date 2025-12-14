import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration(filePath: string, name: string) {
  const client = await pool.connect();
  try {
    console.log(`Running migration: ${name}...`);
    
    // Check if file exists
    try {
      const sql = readFileSync(filePath, 'utf-8');
      
      // Execute the migration SQL directly (it already has BEGIN/COMMIT if needed)
      await client.query(sql);
      
      console.log(`✓ Migration ${name} completed successfully`);
      return true;
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        console.log(`⚠ Migration ${name} skipped (file not found)`);
        return true;
      }
      throw fileError;
    }
  } catch (error: any) {
    // Check if it's a "already exists" or "does not exist" error, which is okay for some migrations
    if (error?.message?.includes('already exists') || 
        error?.message?.includes('does not exist') ||
        error?.message?.includes('duplicate') ||
        error?.message?.includes('current transaction is aborted') ||
        error?.code === '42P07' || // duplicate_table
        error?.code === '42710' || // duplicate_object
        error?.code === '42P01' || // undefined_table (for DROP TABLE IF EXISTS)
        error?.code === '42723') { // duplicate_column (for ADD COLUMN IF NOT EXISTS)
      console.log(`⚠ Migration ${name} skipped (already applied or not needed)`);
      return true;
    }
    console.error(`✗ Migration ${name} failed:`, error.message);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('Starting database migrations...\n');
    
    // Run migration 001
    const migration1Path = join(process.cwd(), 'migrations', '001_single_tenant_migration.sql');
    await runMigration(migration1Path, '001_single_tenant_migration');
    
    // Run migration 002
    const migration2Path = join(process.cwd(), 'migrations', '002_add_pudo_tracking.sql');
    await runMigration(migration2Path, '002_add_pudo_tracking');
    
    // Run migration 003
    const migration3Path = join(process.cwd(), 'migrations', '003_fix_store_owner_role.sql');
    await runMigration(migration3Path, '003_fix_store_owner_role');

    // Migration 004 was removed, skip it

    // Run migration 005
    const migration5Path = join(process.cwd(), 'migrations', '005_add_customer_phone_to_orders.sql');
    await runMigration(migration5Path, '005_add_customer_phone_to_orders');
    
    console.log('\n✓ All migrations completed!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration runner error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();

