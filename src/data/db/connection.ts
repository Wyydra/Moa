import * as SQLite from 'expo-sqlite';
import { Card, Deck } from '../model';

/**
 * Database connection and helper functions for SQLite storage
 * 
 * Note: Schema creation and migrations are managed by migrations.ts
 * This file only handles the database connection and data conversion helpers
 */

const DATABASE_NAME = 'moa.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create database connection
 * 
 * Note: This only opens the connection and configures SQLite settings.
 * Schema creation/migration is handled by migrations.ts during app startup.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  // Configure SQLite settings for optimal performance and data integrity
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);
  
  return db;
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
  // Handle legacy 'language' field for backward compatibility
  const frontLang = deck.frontLanguage !== undefined ? deck.frontLanguage : (deck.language || '');
  const backLang = deck.backLanguage !== undefined ? deck.backLanguage : '';
  
  return {
    id: deck.id,
    name: deck.name,
    description: deck.description || '',
    source_language: frontLang, // Now stores frontLanguage
    back_language: backLang,    // New field for backLanguage
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
    frontLanguage: row.source_language === '' ? undefined : row.source_language,
    backLanguage: row.back_language === '' ? undefined : row.back_language,
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
