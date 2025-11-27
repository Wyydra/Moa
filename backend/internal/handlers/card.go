package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Wyydra/Moa/backend/internal/middleware"
	"github.com/Wyydra/Moa/backend/internal/models"
	"github.com/Wyydra/Moa/backend/internal/repository"
	"github.com/Wyydra/Moa/backend/internal/utils"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CardHandler struct {
	CardRepo *repository.CardRepository
	DeckRepo *repository.DeckRepository
}

func NewCardHandler(cardRepo *repository.CardRepository, deckRepo *repository.DeckRepository) *CardHandler {
	return &CardHandler{
		CardRepo: cardRepo,
		DeckRepo: deckRepo,
	}
}

type CreateCardRequestPayload struct {
	DeckID      string   `json:"deck_id"`
	Front       string   `json:"front"`
	Back        string   `json:"back"`
	Tags        *string  `json:"tags,omitempty"`
	NextReview  *int64   `json:"next_review,omitempty"`
	Interval    *int     `json:"interval,omitempty"`
	EaseFactor  *float64 `json:"ease_factor,omitempty"`
	Repetitions *int     `json:"repetitions,omitempty"`
}

type UpdateCardRequest struct {
	Front       *string  `json:"front,omitempty"`
	Back        *string  `json:"back,omitempty"`
	Tags        *string  `json:"tags,omitempty"`
	NextReview  *int64   `json:"next_review,omitempty"`
	Interval    *int     `json:"interval,omitempty"`
	EaseFactor  *float64 `json:"ease_factor,omitempty"`
	Repetitions *int     `json:"repetitions,omitempty"`
}

type UpdateProgressRequest struct {
	NextReview  int64   `json:"next_review"`
	Interval    int     `json:"interval"`
	EaseFactor  float64 `json:"ease_factor"`
	Repetitions int     `json:"repetitions"`
}

// Create creates a new card
func (h *CardHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateCardRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate input
	if req.Front == "" || req.Back == "" {
		utils.Error(w, http.StatusBadRequest, "front and back are required")
		return
	}

	// Verify deck ownership
	deck, err := h.DeckRepo.GetDeckByID(req.DeckID)
	if err != nil || deck == nil {
		utils.Error(w, http.StatusNotFound, "deck not found")
		return
	}

	if deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	// Create card
	card := &models.Card{
		ID:          uuid.New().String(),
		DeckID:      req.DeckID,
		Front:       req.Front,
		Back:        req.Back,
		Tags:        req.Tags,
		NextReview:  req.NextReview,
		Interval:    req.Interval,
		EaseFactor:  req.EaseFactor,
		Repetitions: req.Repetitions,
	}

	if err := h.CardRepo.CreateCard(card); err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to create card")
		return
	}

	// Update deck card count
	cards, _ := h.CardRepo.GetCardsByDeckID(req.DeckID)
	h.DeckRepo.UpdateCardCount(req.DeckID, len(cards))

	utils.Created(w, card)
}

// GetByDeck returns all cards for a specific deck
// Supports ?include_deleted=true query parameter for sync operations
func (h *CardHandler) GetByDeck(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	deckID := chi.URLParam(r, "deckId")
	if deckID == "" {
		utils.Error(w, http.StatusBadRequest, "deck id is required")
		return
	}

	// Check if we should include deleted items (for sync)
	includeDeleted := r.URL.Query().Get("include_deleted") == "true"

	// Verify deck ownership - use appropriate method based on includeDeleted flag
	var deck *models.Deck
	var err error
	if includeDeleted {
		deck, err = h.DeckRepo.GetDeckByIDIncludingDeleted(deckID)
	} else {
		deck, err = h.DeckRepo.GetDeckByID(deckID)
	}

	if err != nil || deck == nil {
		utils.Error(w, http.StatusNotFound, "deck not found")
		return
	}

	if deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	var cards []models.Card

	if includeDeleted {
		cards, err = h.CardRepo.GetCardsByDeckIDIncludingDeleted(deckID)
	} else {
		cards, err = h.CardRepo.GetCardsByDeckID(deckID)
	}

	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to fetch cards")
		return
	}

	utils.Success(w, cards)
}

// Get returns a single card
func (h *CardHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	cardID := chi.URLParam(r, "id")
	if cardID == "" {
		utils.Error(w, http.StatusBadRequest, "card id is required")
		return
	}

	card, err := h.CardRepo.GetCardByID(cardID)
	if err != nil || card == nil {
		utils.Error(w, http.StatusNotFound, "card not found")
		return
	}

	// Verify deck ownership
	deck, err := h.DeckRepo.GetDeckByID(card.DeckID)
	if err != nil || deck == nil || deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	utils.Success(w, card)
}

// Update updates a card
func (h *CardHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	cardID := chi.URLParam(r, "id")
	if cardID == "" {
		utils.Error(w, http.StatusBadRequest, "card id is required")
		return
	}

	// Get existing card
	card, err := h.CardRepo.GetCardByID(cardID)
	if err != nil || card == nil {
		utils.Error(w, http.StatusNotFound, "card not found")
		return
	}

	// Verify deck ownership
	deck, err := h.DeckRepo.GetDeckByID(card.DeckID)
	if err != nil || deck == nil || deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	// Parse update request
	var req UpdateCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Apply updates
	if req.Front != nil {
		card.Front = *req.Front
	}
	if req.Back != nil {
		card.Back = *req.Back
	}
	if req.Tags != nil {
		card.Tags = req.Tags
	}
	if req.NextReview != nil {
		card.NextReview = req.NextReview
	}
	if req.Interval != nil {
		card.Interval = req.Interval
	}
	if req.EaseFactor != nil {
		card.EaseFactor = req.EaseFactor
	}
	if req.Repetitions != nil {
		card.Repetitions = req.Repetitions
	}

	if err := h.CardRepo.UpdateCard(card); err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to update card")
		return
	}

	utils.Success(w, card)
}

// UpdateProgress updates the SRS progress for a card
func (h *CardHandler) UpdateProgress(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	cardID := chi.URLParam(r, "id")
	if cardID == "" {
		utils.Error(w, http.StatusBadRequest, "card id is required")
		return
	}

	// Get existing card
	card, err := h.CardRepo.GetCardByID(cardID)
	if err != nil || card == nil {
		utils.Error(w, http.StatusNotFound, "card not found")
		return
	}

	// Verify deck ownership
	deck, err := h.DeckRepo.GetDeckByID(card.DeckID)
	if err != nil || deck == nil || deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	// Parse request
	var req UpdateProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Update progress
	if err := h.CardRepo.UpdateCardProgress(cardID, req.NextReview, req.Interval, req.EaseFactor, req.Repetitions); err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to update progress")
		return
	}

	// Fetch updated card
	updatedCard, _ := h.CardRepo.GetCardByID(cardID)
	utils.Success(w, updatedCard)
}

// Delete deletes a card
func (h *CardHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	cardID := chi.URLParam(r, "id")
	if cardID == "" {
		utils.Error(w, http.StatusBadRequest, "card id is required")
		return
	}

	// Get existing card
	card, err := h.CardRepo.GetCardByID(cardID)
	if err != nil || card == nil {
		utils.Error(w, http.StatusNotFound, "card not found")
		return
	}

	deckID := card.DeckID

	// Verify deck ownership
	deck, err := h.DeckRepo.GetDeckByID(deckID)
	if err != nil || deck == nil || deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	if err := h.CardRepo.DeleteCard(cardID); err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to delete card")
		return
	}

	// Update deck card count
	cards, _ := h.CardRepo.GetCardsByDeckID(deckID)
	h.DeckRepo.UpdateCardCount(deckID, len(cards))

	utils.NoContent(w)
}

// GetDueCards returns cards due for review for a specific deck
func (h *CardHandler) GetDueCards(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	deckID := chi.URLParam(r, "deckId")
	if deckID == "" {
		utils.Error(w, http.StatusBadRequest, "deck id is required")
		return
	}

	// Verify deck ownership
	deck, err := h.DeckRepo.GetDeckByID(deckID)
	if err != nil || deck == nil {
		utils.Error(w, http.StatusNotFound, "deck not found")
		return
	}

	if deck.UserID != userID {
		utils.Error(w, http.StatusForbidden, "access denied")
		return
	}

	// Get current time in milliseconds (JavaScript style)
	currentTime := time.Now().UnixMilli()

	cards, err := h.CardRepo.GetCardsDueForReview(deckID, currentTime)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to fetch due cards")
		return
	}

	utils.Success(w, cards)
}
