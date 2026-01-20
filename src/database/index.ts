import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { runMigrations } from "./migrations";

let db: SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLiteDatabase> {
  if (db) {
    return db;
  }

  console.log('Initializing database')

  try {
    db = await openDatabaseAsync('moa.db')

    await runMigrations(db)

    console.log('Database Initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialise database:', error)
    throw error;
  }
}

export function getDatabase(): SQLiteDatabase {
  if (!db) {
    throw new Error(
      'Database not initialized. Call initDatabase() first.'
    );
  }
  return db;
}

export async function resetDatabase() {
  const db = getDatabase();
  console.log('Resetting database...');

  await db.execAsync('PRAGMA foreign_keys = OFF');

  const result = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );

  await db.withTransactionAsync(async () => {
    for (const row of result) {
      console.log(`Dropping table ${row.name}`);
      await db.runAsync(`DROP TABLE IF EXISTS ${row.name}`);
    }
  });

  await db.execAsync('PRAGMA foreign_keys = ON');
  console.log('Database reset complete. Re-running migrations...');
  await runMigrations(db);
}
