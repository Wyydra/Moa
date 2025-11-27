package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Wyydra/Moa/backend/internal/middleware"
	"github.com/Wyydra/Moa/backend/internal/models"
	"github.com/Wyydra/Moa/backend/internal/repository"
	"github.com/Wyydra/Moa/backend/internal/utils"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type DeckHandler struct {
	DeckRepo *repository.DeckRepository
	CardRepo *repository.CardRepository
}

func NewDeckHandler(deckRepo *repository.DeckRepository, cardRepo *repository.CardRepository) *DeckHandler {
	return &DeckHandler{
		DeckRepo: deckRepo,
		CardRepo: cardRepo,
	}
}

type CreateDeckRequest struct {
	Name        string              `json:"name"`
	Description *string             `json:"description,omitempty"`
	Language    *string             `json:"language,omitempty"`
	Tags        *string             `json:"tags,omitempty"`
	IsPublic    bool                `json:"is_public"`
	Cards       []CreateCardRequest `json:"cards,omitempty"`
}

type CreateCardRequest struct {
	Front string  `json:"front"`
	Back  string  `json:"back"`
	Tags  *string `json:"tags,omitempty"`
}

type UpdateDeckRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	Language    *string `json:"language,omitempty"`
	Tags        *string `json:"tags,omitempty"`
	IsPublic    *bool   `json:"is_public,omitempty"`
}

// List returns all decks for the authenticated user
// Supports ?include_deleted=true query parameter for sync operations
func (h *DeckHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// Check if we should include deleted items (for sync)
	includeDeleted := r.URL.Query().Get("include_deleted") == "true"

	var decks []models.Deck
	var err error

	if includeDeleted {
		decks, err = h.DeckRepo.GetDecksByUserIDIncludingDeleted(userID)
	} else {
		decks, err = h.DeckRepo.GetDecksByUserID(userID)
	}

	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to fetch decks")
		return
	}

	utils.Success(w, decks)
}

// Create creates a new deck with optional cards
func (h *DeckHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateDeckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate input
	if req.Name == "" {
		utils.Error(w, http.StatusBadRequest, "name is required")
		return
	}

	// Create deck
	deck := &models.Deck{
		ID:          uuid.New().String(),
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Language:    req.Language,
		Tags:        req.Tags,
		IsPublic:    req.IsPublic,
		CardCount:   0,
	}

	if err := h.DeckRepo.CreateDeck(deck); err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to create deck")
		return
	}

	// Create cards if provided
	if len(req.Cards) > 0 {
		cards := make([]models.Card, len(req.Cards))
		for i, cardReq := range req.Cards {
			cards[i] = models.Card{
				ID:     uuid.New().String(),
				DeckID: deck.ID,
				Front:  cardReq.Front,
				Back:   cardReq.Back,
				Tags:   cardReq.Tags,
			}
		}

		if err := h.CardRepo.CreateCards(cards); err != nil {
			utils.Error(w, http.StatusInternalServerError, "failed to create cards")
			return
		}

		// Update card count
		if err := h.DeckRepo.UpdateCardCount(deck.ID, len(cards)); err != nil {
			utils.Error(w, http.StatusInternalServerError, "failed to update card count")
			return
		}
	}

	utils.Created(w, deck)
}

// Get returns a single deck with all its cards
func (h *DeckHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	deckID := chi.URLParam(r, "id")
	if deckID == "" {
		utils.Error(w, http.StatusBadRequest, "deck id is required")
		return
	}

	// Get deck with cards
	deckWithCards, err := h.DeckRepo.GetDeckWithCards(deckID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "deck not found")
		return
	}

	// Verify ownership
	if deckWithCards.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	utils.Success(w, deckWithCards)
}

// Update updates a deck's metadata
func (h *DeckHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	deckID := chi.URLParam(r, "id")
	if deckID == "" {
		utils.Error(w, http.StatusBadRequest, "deck id is required")
		return
	}

	// Verify ownership
	deck, err := h.DeckRepo.GetDeckByID(deckID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "deck not found")
		return
	}

	if deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	// Parse update request
	var req UpdateDeckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Apply updates
	if req.Name != nil {
		deck.Name = *req.Name
	}
	if req.Description != nil {
		deck.Description = req.Description
	}
	if req.Language != nil {
		deck.Language = req.Language
	}
	if req.Tags != nil {
		deck.Tags = req.Tags
	}
	if req.IsPublic != nil {
		deck.IsPublic = *req.IsPublic
	}

	if err := h.DeckRepo.UpdateDeck(deck); err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to update deck")
		return
	}

	utils.Success(w, deck)
}

// Delete deletes a deck and all its cards
func (h *DeckHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	deckID := chi.URLParam(r, "id")
	if deckID == "" {
		utils.Error(w, http.StatusBadRequest, "deck id is required")
		return
	}

	// Verify ownership
	deck, err := h.DeckRepo.GetDeckByID(deckID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "deck not found")
		return
	}

	if deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	if err := h.DeckRepo.SoftDeleteDeckWithCards(deckID); err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to delete deck")
		return
	}

	utils.NoContent(w)
}
