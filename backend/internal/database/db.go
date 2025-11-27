package database

import (
	"log"
	"os"
	"path/filepath"

	"github.com/Wyydra/Moa/backend/internal/config"
	"github.com/jmoiron/sqlx"
)

type Database struct {
	*sqlx.DB
}

func Connect() (*Database, error) {
	cfg := config.AppConfig

	dbDir := filepath.Dir(cfg.DBPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return nil, err
	}

	db, err := sqlx.Connect("sqlite3", cfg.DBPath+"?_foreign_keys=on")
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(1)

	log.Println("Database connected:", cfg.DBPath)

	return &Database{DB: db}, nil
}

func (d *Database) Close() error {
	if d.DB != nil {
		return d.DB.Close()
	}
	return nil
}
