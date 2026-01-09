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
