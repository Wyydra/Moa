import { SQLiteDatabase } from "expo-sqlite";

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
                     CREATE TABLE deck (
                       id INTEGER PRIMARY KEY,
                       name TEXT NOT NULL,
                       description TEXT,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                     );
                     CREATE TABLE card (
                       id INTEGER PRIMARY KEY,
                       front TEXT NOT NULL,
                       back TEXT NOT NULL,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       deck_id INTEGER NOT NULL,

                       CONSTRAINT fk_deck
                          FOREIGN KEY (deck_id)
                          REFERENCES deck (id)
                          ON DELETE CASCADE
                     );
                     CREATE TABLE tag (
                       id INTEGER PRIMARY KEY,
                       name TEXT NOT NULL UNIQUE,
                       color TEXT
                     );
                     CREATE TABLE IF NOT EXISTS deck_tag (
                       deck_id INTEGER,
                       tag_id INTEGER,
                       PRIMARY KEY (deck_id, tag_id), -- La paire doit être unique
                       FOREIGN KEY (deck_id) REFERENCES deck(id) ON DELETE CASCADE,
                       FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
                     );

                     CREATE TABLE IF NOT EXISTS card_tag (
                       card_id INTEGER,
                       tag_id INTEGER,
                       PRIMARY KEY (card_id, tag_id), -- La paire doit être unique
                       FOREIGN KEY (card_id) REFERENCES card(id) ON DELETE CASCADE,
                       FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
                     );

                     CREATE TRIGGER IF NOT EXISTS update_deck_timestamp 
                     AFTER UPDATE ON deck
                     BEGIN
                       UPDATE deck SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                     END;
                     `);
}
