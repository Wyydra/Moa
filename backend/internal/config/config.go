package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	Env            string
	DBPath         string
	JWTSecret      string
	JWTExpiry      string
	AllowedOrigins string
}

var AppConfig *Config

func Load() error {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	AppConfig = &Config{
		Port:           getEnv("PORT", "8080"),
		Env:            getEnv("ENV", "development"),
		DBPath:         getEnv("DB_PATH", "./data/moa.db"),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		JWTExpiry:      getEnv("JWT_EXPIRY", "24h"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:19000"),
	}

	if AppConfig.JWTSecret == "" {
		log.Fatal("JWT_SECRET must be set")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
