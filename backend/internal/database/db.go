package database

import (
	"github.com/jmoiron/sqlx"
)

var DB *sqlx.DB

func Connect() error {
	cfg := config.AppConfig
}
