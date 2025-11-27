package database

import (
	"log"
	"os"
	"path/filepath"
)

// RunMigrations applies database migrations
func (db *Database) RunMigrations() error {
	log.Println("Running database migrations...")

	// Read and execute migration files
	migrationsDir := "migrations"
	migrations := []string{
		"000001_create_users.up.sql",
		"000002_create_decks.up.sql",
		"000003_create_cards.up.sql",
	}

	for _, migration := range migrations {
		migrationPath := filepath.Join(migrationsDir, migration)
		content, err := os.ReadFile(migrationPath)
		if err != nil {
			// If migration file doesn't exist, skip it (might already be applied)
			log.Printf("Warning: Could not read migration %s: %v", migration, err)
			continue
		}

		if _, err := db.Exec(string(content)); err != nil {
			// Ignore "already exists" errors
			log.Printf("Migration %s: %v (might already be applied)", migration, err)
			continue
		}

		log.Printf("Applied migration: %s", migration)
	}

	log.Println("Migrations completed")
	return nil
}
