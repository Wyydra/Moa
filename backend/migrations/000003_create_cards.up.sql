CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deck_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    tags TEXT,
    next_review INTEGER,
    interval INTEGER,
    ease_factor REAL,
    repetitions INTEGER,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at DATETIME,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_cards_deleted ON cards(deleted);
