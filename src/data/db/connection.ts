import * as SQLite from 'expo-sqlite';
import { Card, Deck } from '../model';

/**
 * Database connection and schema management for SQLite storage
 * Handles initialization, migrations, and transaction management
 */

const DATABASE_NAME = 'moa.db';
const CURRENT_SCHEMA_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create database connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeSchema(db);
  return db;
}

/**
 * Initialize database schema and perform migrations if needed
 */
async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Create metadata table first to track schema version
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Check current schema version
  const result = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM metadata WHERE key = ?',
    ['schema_version']
  );

  const currentVersion = result ? parseInt(result.value, 10) : 0;

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    await migrateSchema(database, currentVersion, CURRENT_SCHEMA_VERSION);
  }
}

/**
 * Create all tables, indexes, and views for schema v1
 */
async function createSchemaV1(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Decks table
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      source_language TEXT NOT NULL,
      target_language TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL, -- JSON array
      is_public INTEGER NOT NULL DEFAULT 0,
      shared_by TEXT,
      total_cards INTEGER NOT NULL DEFAULT 0,
      mastered_cards INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Cards table
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      pronunciation TEXT,
      difficulty INTEGER NOT NULL DEFAULT 0,
      last_reviewed INTEGER,
      next_review INTEGER,
      review_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      incorrect_count INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 0,
      stroke_order_data TEXT, -- JSON
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    -- Study sessions table
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      mode TEXT NOT NULL, -- 'learn', 'test', 'write', 'match'
      correct INTEGER NOT NULL,
      time_spent INTEGER NOT NULL,
      difficulty INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
    CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review);
    CREATE INDEX IF NOT EXISTS idx_cards_difficulty ON cards(difficulty);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_deck_id ON study_sessions(deck_id);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_card_id ON study_sessions(card_id);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_mode ON study_sessions(mode);

    -- Views for common queries
    CREATE VIEW IF NOT EXISTS deck_summary AS
    SELECT 
      d.id,
      d.name,
      d.description,
      d.source_language,
      d.target_language,
      d.category,
      d.tags,
      d.is_public,
      d.shared_by,
      d.created_at,
      d.updated_at,
      COUNT(c.id) as total_cards,
      SUM(CASE WHEN c.difficulty = 5 THEN 1 ELSE 0 END) as mastered_cards
    FROM decks d
    LEFT JOIN cards c ON d.id = c.deck_id
    GROUP BY d.id;

    CREATE VIEW IF NOT EXISTS card_with_deck AS
    SELECT 
      c.*,
      d.name as deck_name,
      d.source_language,
      d.target_language
    FROM cards c
    JOIN decks d ON c.deck_id = d.id;
  `);

  // Set schema version
  await database.runAsync(
    'INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)',
    ['schema_version', CURRENT_SCHEMA_VERSION.toString(), Date.now()]
  );
}

/**
 * Migrate schema from one version to another
 */
async function migrateSchema(
  database: SQLite.SQLiteDatabase,
  fromVersion: number,
  toVersion: number
): Promise<void> {
  console.log(`Migrating schema from v${fromVersion} to v${toVersion}`);

  if (fromVersion === 0 && toVersion === 1) {
    // Fresh install - create schema v1
    await createSchemaV1(database);
    console.log('Schema v1 created successfully');
  }
  
  // Future migrations will go here:
  // if (fromVersion === 1 && toVersion === 2) {
  //   await migrateV1ToV2(database);
  // }
}

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 */
export async function withTransaction<T>(
  fn: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const database = await getDatabase();
  
  try {
    await database.execAsync('BEGIN TRANSACTION');
    const result = await fn(database);
    await database.execAsync('COMMIT');
    return result;
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
}

/**
 * Close database connection (for testing/cleanup)
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Helper to convert Card model to database row
 * Maps current Card model to extended database schema
 */
export function cardToRow(card: Card): Record<string, any> {
  return {
    id: card.id,
    deck_id: card.deckId,
    front: card.front,
    back: card.back,
    pronunciation: null, // Future feature
    difficulty: 0, // Calculated from easeFactor later
    last_reviewed: null, // Track via study_sessions
    next_review: card.nextReview,
    review_count: card.repetitions, // Map repetitions to review_count
    correct_count: 0, // Calculated from study_sessions
    incorrect_count: 0, // Calculated from study_sessions
    ease_factor: card.easeFactor,
    interval: card.interval,
    stroke_order_data: null, // Future feature
    created_at: card.createdAt,
    updated_at: Date.now(),
  };
}

/**
 * Helper to convert database row to Card model
 * Maps extended database schema back to current Card model
 */
export function rowToCard(row: any): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    nextReview: row.next_review,
    interval: row.interval,
    easeFactor: row.ease_factor,
    repetitions: row.review_count,
    createdAt: row.created_at,
    tags: [], // Not stored per-card currently
  };
}

/**
 * Helper to convert Deck model to database row
 * Maps current Deck model to extended database schema
 */
export function deckToRow(deck: Deck): Record<string, any> {
  return {
    id: deck.id,
    name: deck.name,
    description: deck.description || '',
    source_language: deck.language || 'en-US', // Use single language field
    target_language: 'en-US', // Default, future feature for language pairs
    category: 'general', // Future feature
    tags: JSON.stringify(deck.tags || []),
    is_public: 0, // Future feature
    shared_by: null, // Future feature
    total_cards: deck.cardCount,
    mastered_cards: 0, // Calculated from cards
    created_at: deck.createdAt,
    updated_at: Date.now(),
  };
}

/**
 * Helper to convert database row to Deck model
 * Maps extended database schema back to current Deck model
 */
export function rowToDeck(row: any): Deck {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    createdAt: row.created_at,
    cardCount: row.total_cards,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    language: row.source_language || undefined,
  };
}

/**
 * Get the size of the SQLite database in bytes
 * Returns the page_count * page_size from SQLite metadata
 */
export async function getDatabaseSize(): Promise<number> {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ total_size: number }>(
      'SELECT page_count * page_size as total_size FROM pragma_page_count(), pragma_page_size()'
    );
    
    return result?.total_size || 0;
  } catch (error) {
    console.error('Error getting database size:', error);
    return 0;
  }
}
