import { SQLiteDatabase } from "expo-sqlite";
import { up as migration001 } from './001_initial'

const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS migrations (
  version INTEGER PRIMARY KEY,
name TEXT NOT NULL,
applied_at INTEGER NOT NULL
);
`

interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {version: 1, name: 'initial_schema', up: migration001},
]

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  console.log('Starting database migrations');

  await db.execAsync('PRAGMA foreign_keys = ON;')

  await db.execAsync(MIGRATIONS_TABLE);

  const result = await db.getFirstAsync<{ version: number | null }>(
    'SELECT MAX(version) as version FROM migrations'
  );
  const currentVersion = result?.version ?? 0;
  console.log(`Current database version: ${currentVersion}`);

  const pendingMigrations = migrations.filter(m => m.version > currentVersion);
  
  if (pendingMigrations.length === 0) {
    console.log('Database is up to date (no pending migrations)');
    return;
  }

  console.log(`Found ${pendingMigrations.length} pending migration(s)`);

  for (const migration of pendingMigrations) {
    console.log(`Running migration ${migration.version}: ${migration.name}`)

    try {
      await db.withTransactionAsync(async () => {
        await migration.up(db)

        await db.runAsync(
          'INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.name, Date.now()]
        )
      });

      console.log(`Migration ${migration.version} completed successfully`)
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error)
      throw new Error (
        `Failed to apply migration ${migration.version} (${migration.name}): ${error}`
      );
    }
  }

  console.log('All migrations completed')
}
