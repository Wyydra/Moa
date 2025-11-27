package server

import (
	"net/http"

	"github.com/Wyydra/Moa/backend/internal/handlers"
	"github.com/Wyydra/Moa/backend/internal/middleware"
	"github.com/Wyydra/Moa/backend/internal/repository"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// Server holds the dependencies for the HTTP server
type Server struct {
	UserRepo *repository.UserRepository
	DeckRepo *repository.DeckRepository
	CardRepo *repository.CardRepository
}

// NewServer creates a new server instance
func NewServer(
	userRepo *repository.UserRepository,
	deckRepo *repository.DeckRepository,
	cardRepo *repository.CardRepository,
) *Server {
	return &Server{
		UserRepo: userRepo,
		DeckRepo: deckRepo,
		CardRepo: cardRepo,
	}
}

// SetupRouter configures and returns the HTTP router
func (s *Server) SetupRouter() chi.Router {
	r := chi.NewRouter()

	// Middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:19000", "http://localhost:8081", "exp://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(s.UserRepo)
	deckHandler := handlers.NewDeckHandler(s.DeckRepo, s.CardRepo)

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Public routes - Authentication
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth)
			r.Get("/me", authHandler.GetMe)
			r.Get("/decks", deckHandler.List)
			r.Post("/decks", deckHandler.Create)
			r.Get("/decks/{id}", deckHandler.Get)
			r.Put("/decks/{id}", deckHandler.Update)
			r.Delete("/decks/{id}", deckHandler.Delete)
		})
	})

	return r
}
