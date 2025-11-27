package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Wyydra/Moa/backend/internal/config"
	"github.com/Wyydra/Moa/backend/internal/database"
	"github.com/Wyydra/Moa/backend/internal/repository"
	"github.com/Wyydra/Moa/backend/internal/server"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Load configuration
	if err := config.Load(); err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Connect to database
	db, err := database.Connect()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run migrations
	if err := db.RunMigrations(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	deckRepo := repository.NewDeckRepository(db)
	cardRepo := repository.NewCardRepository(db)

	// Start cleanup goroutine for soft-deleted items (runs every 24 hours)
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			log.Println("Running cleanup of old deleted items...")

			if deletedDecks, err := deckRepo.CleanupOldDeletedDecks(); err != nil {
				log.Printf("Error cleaning up old deleted decks: %v", err)
			} else if deletedDecks > 0 {
				log.Printf("Cleaned up %d old deleted decks", deletedDecks)
			}

			if deletedCards, err := cardRepo.CleanupOldDeletedCards(); err != nil {
				log.Printf("Error cleaning up old deleted cards: %v", err)
			} else if deletedCards > 0 {
				log.Printf("Cleaned up %d old deleted cards", deletedCards)
			}

			log.Println("Cleanup completed")
		}
	}()

	// Setup server
	srv := server.NewServer(userRepo, deckRepo, cardRepo)
	router := srv.SetupRouter()

	// Start server
	addr := fmt.Sprintf(":%s", config.AppConfig.Port)
	log.Printf("Server starting on %s (env: %s)", addr, config.AppConfig.Env)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
