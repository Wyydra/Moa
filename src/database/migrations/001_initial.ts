import { SQLiteDatabase } from "expo-sqlite";

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
                     CREATE TABLE decks (
                       id TEXT PRIMARY KEY,
                       name TEXT NOT NULL,
                       description TEXT,
                       created_at INTEGER NOT NULL,
                       updated_at INTEGER NOT NULL
                     );
                     CREATE TABLE tags (
                       id TEXT PRIMARY KEY,
                       name TEXT NOT NULL UNIQUE,
                       color TEXT NOT NULL
                     );
                     CREATE TABLE deck_tags (
                       deck_id TEXT NOT NULL,
                       tag_id TEXT NOT NULL,
                       PRIMARY KEY (deck_id, tag_id),
                       FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
                       FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                     );
                     CREATE TABLE cards (
                       id TEXT PRIMARY KEY,
                       deck_id TEXT NOT NULL,

                       -- Content (can contain Markdown)
                       front TEXT NOT NULL,
                       back TEXT NOT NULL,
                       notes TEXT,

                       -- SM-2 spaced repetition fields
                       ease_factor REAL NOT NULL DEFAULT 2.5,
                       interval INTEGER NOT NULL DEFAULT 0,
                       repetitions INTEGER NOT NULL DEFAULT 0,
                       next_review INTEGER,
                       last_reviewed INTEGER,

                       created_at INTEGER NOT NULL,

                       FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
                     );

                     CREATE TABLE review_history (
                       id TEXT PRIMARY KEY,
                       card_id TEXT NOT NULL,
                       quality INTEGER NOT NULL CHECK(quality >= 0 AND quality <= 5),
                         time_spent INTEGER,
                       reviewed_at INTEGER NOT NULL,

                       FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
                     );
                     CREATE TABLE user_stats (
                       id INTEGER PRIMARY KEY CHECK (id = 1),
                         current_streak INTEGER NOT NULL DEFAULT 0,
                       longest_streak INTEGER NOT NULL DEFAULT 0,
                       total_reviews INTEGER NOT NULL DEFAULT 0,
                       last_study_date INTEGER,
                       created_at INTEGER NOT NULL,
                       updated_at INTEGER NOT NULL
                     );
                     CREATE INDEX idx_cards_deck_id ON cards(deck_id);
                     CREATE INDEX idx_cards_next_review ON cards(next_review);
                     CREATE INDEX idx_review_history_card_id ON review_history(card_id);
                     CREATE INDEX idx_review_history_reviewed_at ON review_history(reviewed_at);
                     `);
}
