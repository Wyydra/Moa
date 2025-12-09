import * as SQLite from 'expo-sqlite';

/**
 * Database schema definitions
 * This file contains pure SQL schema definitions (version 2)
 * 
 * Version 2 changes:
 * - Added back_language column to decks table for separate front/back TTS languages
 */

/**
 * Create the complete database schema (version 2)
 * Includes: decks (with back_language), cards, study_sessions
 * Includes: All indexes and views
 * 
 * This is used for fresh installations that go directly to v2
 */
export async function createInitialSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- Decks table (VERSION 2 - includes back_language)
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      source_language TEXT NOT NULL,
      back_language TEXT NOT NULL DEFAULT '',
      target_language TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
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
      stroke_order_data TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    -- Study sessions table
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      mode TEXT NOT NULL,
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
}
