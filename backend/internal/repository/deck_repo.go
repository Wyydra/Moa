package repository

import (
	"database/sql"
	"time"

	"github.com/Wyydra/Moa/backend/internal/database"
	"github.com/Wyydra/Moa/backend/internal/models"
)

type DeckRepository struct {
	db *database.Database
}

func NewDeckRepository(db *database.Database) *DeckRepository {
	return &DeckRepository{db: db}
}

// CreateDeck inserts a new deck into the database
func (r *DeckRepository) CreateDeck(deck *models.Deck) error {
	query := `
		INSERT INTO decks (id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	_, err := r.db.Exec(
		query,
		deck.ID,
		now,
		now,
		deck.UserID,
		deck.Name,
		deck.Description,
		deck.Language,
		deck.Tags,
		deck.CardCount,
		deck.IsPublic,
	)
	if err != nil {
		return err
	}

	deck.CreatedAt = now
	deck.UpdatedAt = now
	return nil
}

// GetDecksByUserID retrieves all decks belonging to a user
func (r *DeckRepository) GetDecksByUserID(userID int64) ([]models.Deck, error) {
	var decks []models.Deck
	query := `
		SELECT id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public
		FROM decks
		WHERE user_id = ?
		ORDER BY updated_at DESC
	`

	err := r.db.Select(&decks, query, userID)
	if err != nil {
		return nil, err
	}

	return decks, nil
}

// GetDeckByID retrieves a single deck by ID
func (r *DeckRepository) GetDeckByID(deckID string) (*models.Deck, error) {
	var deck models.Deck
	query := `
		SELECT id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public
		FROM decks
		WHERE id = ?
	`

	err := r.db.Get(&deck, query, deckID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &deck, nil
}

// GetDeckWithCards retrieves a deck along with all its cards
func (r *DeckRepository) GetDeckWithCards(deckID string) (*models.DeckWithCards, error) {
	deck, err := r.GetDeckByID(deckID)
	if err != nil {
		return nil, err
	}
	if deck == nil {
		return nil, nil
	}

	var cards []models.Card
	cardQuery := `
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions
		FROM cards
		WHERE deck_id = ?
		ORDER BY created_at ASC
	`

	err = r.db.Select(&cards, cardQuery, deckID)
	if err != nil {
		return nil, err
	}

	return &models.DeckWithCards{
		Deck:  *deck,
		Cards: cards,
	}, nil
}

// UpdateDeck updates an existing deck's information
func (r *DeckRepository) UpdateDeck(deck *models.Deck) error {
	query := `
		UPDATE decks
		SET updated_at = ?, name = ?, description = ?, language = ?, tags = ?, is_public = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := r.db.Exec(
		query,
		now,
		deck.Name,
		deck.Description,
		deck.Language,
		deck.Tags,
		deck.IsPublic,
		deck.ID,
	)
	if err != nil {
		return err
	}

	deck.UpdatedAt = now
	return nil
}

// UpdateCardCount updates the card count for a deck
func (r *DeckRepository) UpdateCardCount(deckID string, count int) error {
	query := `
		UPDATE decks
		SET card_count = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, count, time.Now(), deckID)
	return err
}

// DeleteDeck deletes a deck and all its cards (via CASCADE)
func (r *DeckRepository) DeleteDeck(deckID string) error {
	query := `DELETE FROM decks WHERE id = ?`
	_, err := r.db.Exec(query, deckID)
	return err
}

// GetPublicDecks retrieves all public decks (for browsing/sharing)
func (r *DeckRepository) GetPublicDecks(limit, offset int) ([]models.Deck, error) {
	var decks []models.Deck
	query := `
		SELECT id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public
		FROM decks
		WHERE is_public = TRUE
		ORDER BY updated_at DESC
		LIMIT ? OFFSET ?
	`

	err := r.db.Select(&decks, query, limit, offset)
	if err != nil {
		return nil, err
	}

	return decks, nil
}
