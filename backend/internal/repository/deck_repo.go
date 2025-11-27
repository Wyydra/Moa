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
		INSERT INTO decks (id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public, deleted, deleted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
		deck.Deleted,
		deck.DeletedAt,
	)
	if err != nil {
		return err
	}

	deck.CreatedAt = now
	deck.UpdatedAt = now
	return nil
}

// GetDecksByUserID retrieves all non-deleted decks belonging to a user
func (r *DeckRepository) GetDecksByUserID(userID int64) ([]models.Deck, error) {
	var decks []models.Deck
	query := `
		SELECT id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public, deleted, deleted_at
		FROM decks
		WHERE user_id = ? AND deleted = FALSE
		ORDER BY updated_at DESC
	`

	err := r.db.Select(&decks, query, userID)
	if err != nil {
		return nil, err
	}

	return decks, nil
}

// GetDecksByUserIDIncludingDeleted retrieves all decks (including soft-deleted) belonging to a user
// This is used for sync operations to propagate tombstones
func (r *DeckRepository) GetDecksByUserIDIncludingDeleted(userID int64) ([]models.Deck, error) {
	var decks []models.Deck
	query := `
		SELECT id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public, deleted, deleted_at
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

// GetDeckByID retrieves a single non-deleted deck by ID
func (r *DeckRepository) GetDeckByID(deckID string) (*models.Deck, error) {
	var deck models.Deck
	query := `
		SELECT id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public, deleted, deleted_at
		FROM decks
		WHERE id = ? AND deleted = FALSE
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

// GetDeckByIDIncludingDeleted retrieves a single deck by ID, including soft-deleted ones
// This is used for sync operations when we need to access deleted deck metadata
func (r *DeckRepository) GetDeckByIDIncludingDeleted(deckID string) (*models.Deck, error) {
	var deck models.Deck
	query := `
		SELECT id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public, deleted, deleted_at
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

// GetDeckWithCards retrieves a deck along with all its non-deleted cards
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
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions, deleted, deleted_at
		FROM cards
		WHERE deck_id = ? AND deleted = FALSE
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
		SET updated_at = ?, name = ?, description = ?, language = ?, tags = ?, is_public = ?, deleted = ?, deleted_at = ?
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
		deck.Deleted,
		deck.DeletedAt,
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

// DeleteDeck soft deletes a deck (marks as deleted)
func (r *DeckRepository) DeleteDeck(deckID string) error {
	query := `UPDATE decks SET deleted = TRUE, deleted_at = ?, updated_at = ? WHERE id = ?`
	now := time.Now()
	_, err := r.db.Exec(query, now, now, deckID)
	return err
}

// SoftDeleteDeckWithCards soft deletes a deck and all its cards
func (r *DeckRepository) SoftDeleteDeckWithCards(deckID string) error {
	now := time.Now()

	// Start transaction
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Soft delete the deck
	deckQuery := `UPDATE decks SET deleted = TRUE, deleted_at = ?, updated_at = ? WHERE id = ?`
	_, err = tx.Exec(deckQuery, now, now, deckID)
	if err != nil {
		return err
	}

	// Soft delete all cards in the deck
	cardsQuery := `UPDATE cards SET deleted = TRUE, deleted_at = ?, updated_at = ? WHERE deck_id = ?`
	_, err = tx.Exec(cardsQuery, now, now, deckID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// CleanupOldDeletedDecks hard deletes decks that have been soft deleted for more than 30 days
func (r *DeckRepository) CleanupOldDeletedDecks() (int64, error) {
	cutoffTime := time.Now().AddDate(0, 0, -30)
	query := `DELETE FROM decks WHERE deleted = TRUE AND deleted_at < ?`
	result, err := r.db.Exec(query, cutoffTime)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// GetPublicDecks retrieves all non-deleted public decks (for browsing/sharing)
func (r *DeckRepository) GetPublicDecks(limit, offset int) ([]models.Deck, error) {
	var decks []models.Deck
	query := `
		SELECT id, created_at, updated_at, user_id, name, description, language, tags, card_count, is_public, deleted, deleted_at
		FROM decks
		WHERE is_public = TRUE AND deleted = FALSE
		ORDER BY updated_at DESC
		LIMIT ? OFFSET ?
	`

	err := r.db.Select(&decks, query, limit, offset)
	if err != nil {
		return nil, err
	}

	return decks, nil
}
