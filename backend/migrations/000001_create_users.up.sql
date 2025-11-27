CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    password TEXT,
    provider TEXT NOT NULL DEFAULT 'email',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verify_token TEXT,
    reset_token TEXT,
    reset_expiry DATETIME,
    avatar TEXT
);
CREATE INDEX idx_users_email ON users(email);
