package repository

import (
	"database/sql"
	"time"

	"github.com/Wyydra/Moa/backend/internal/database"
	"github.com/Wyydra/Moa/backend/internal/models"
)

type CardRepository struct {
	db *database.Database
}

func NewCardRepository(db *database.Database) *CardRepository {
	return &CardRepository{db: db}
}

// CreateCard inserts a new card into the database
func (r *CardRepository) CreateCard(card *models.Card) error {
	query := `
		INSERT INTO cards (id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions, deleted, deleted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	_, err := r.db.Exec(
		query,
		card.ID,
		now,
		now,
		card.DeckID,
		card.Front,
		card.Back,
		card.Tags,
		card.NextReview,
		card.Interval,
		card.EaseFactor,
		card.Repetitions,
		card.Deleted,
		card.DeletedAt,
	)
	if err != nil {
		return err
	}

	card.CreatedAt = now
	card.UpdatedAt = now
	return nil
}

// CreateCards performs a bulk insert of multiple cards
func (r *CardRepository) CreateCards(cards []models.Card) error {
	if len(cards) == 0 {
		return nil
	}

	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO cards (id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions, deleted, deleted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	stmt, err := tx.Preparex(query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now()
	for i := range cards {
		_, err := stmt.Exec(
			cards[i].ID,
			now,
			now,
			cards[i].DeckID,
			cards[i].Front,
			cards[i].Back,
			cards[i].Tags,
			cards[i].NextReview,
			cards[i].Interval,
			cards[i].EaseFactor,
			cards[i].Repetitions,
			cards[i].Deleted,
			cards[i].DeletedAt,
		)
		if err != nil {
			return err
		}
		cards[i].CreatedAt = now
		cards[i].UpdatedAt = now
	}

	return tx.Commit()
}

// GetCardsByDeckID retrieves all non-deleted cards for a specific deck
func (r *CardRepository) GetCardsByDeckID(deckID string) ([]models.Card, error) {
	var cards []models.Card
	query := `
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions, deleted, deleted_at
		FROM cards
		WHERE deck_id = ? AND deleted = FALSE
		ORDER BY created_at ASC
	`

	err := r.db.Select(&cards, query, deckID)
	if err != nil {
		return nil, err
	}

	return cards, nil
}

// GetCardsByDeckIDIncludingDeleted retrieves all cards (including soft-deleted) for a specific deck
// This is used for sync operations to propagate tombstones
func (r *CardRepository) GetCardsByDeckIDIncludingDeleted(deckID string) ([]models.Card, error) {
	var cards []models.Card
	query := `
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions, deleted, deleted_at
		FROM cards
		WHERE deck_id = ?
		ORDER BY created_at ASC
	`

	err := r.db.Select(&cards, query, deckID)
	if err != nil {
		return nil, err
	}

	return cards, nil
}

// GetCardByID retrieves a single non-deleted card by ID
func (r *CardRepository) GetCardByID(cardID string) (*models.Card, error) {
	var card models.Card
	query := `
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions, deleted, deleted_at
		FROM cards
		WHERE id = ? AND deleted = FALSE
	`

	err := r.db.Get(&card, query, cardID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &card, nil
}

// UpdateCard updates an existing card
func (r *CardRepository) UpdateCard(card *models.Card) error {
	query := `
		UPDATE cards
		SET updated_at = ?, front = ?, back = ?, tags = ?, next_review = ?, interval = ?, ease_factor = ?, repetitions = ?, deleted = ?, deleted_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := r.db.Exec(
		query,
		now,
		card.Front,
		card.Back,
		card.Tags,
		card.NextReview,
		card.Interval,
		card.EaseFactor,
		card.Repetitions,
		card.Deleted,
		card.DeletedAt,
		card.ID,
	)
	if err != nil {
		return err
	}

	card.UpdatedAt = now
	return nil
}

// UpdateCardProgress updates SRS-related fields for a card
func (r *CardRepository) UpdateCardProgress(cardID string, nextReview int64, interval int, easeFactor float64, repetitions int) error {
	query := `
		UPDATE cards
		SET next_review = ?, interval = ?, ease_factor = ?, repetitions = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, nextReview, interval, easeFactor, repetitions, time.Now(), cardID)
	return err
}

// DeleteCard soft deletes a single card
func (r *CardRepository) DeleteCard(cardID string) error {
	query := `UPDATE cards SET deleted = TRUE, deleted_at = ?, updated_at = ? WHERE id = ?`
	now := time.Now()
	_, err := r.db.Exec(query, now, now, cardID)
	return err
}

// DeleteCardsByDeckID soft deletes all cards in a deck (used internally by cascade)
func (r *CardRepository) DeleteCardsByDeckID(deckID string) error {
	query := `UPDATE cards SET deleted = TRUE, deleted_at = ?, updated_at = ? WHERE deck_id = ?`
	now := time.Now()
	_, err := r.db.Exec(query, now, now, deckID)
	return err
}

// SoftDeleteCardsByDeckID soft deletes all cards in a deck
func (r *CardRepository) SoftDeleteCardsByDeckID(deckID string) error {
	return r.DeleteCardsByDeckID(deckID)
}

// CleanupOldDeletedCards hard deletes cards that have been soft deleted for more than 30 days
func (r *CardRepository) CleanupOldDeletedCards() (int64, error) {
	cutoffTime := time.Now().AddDate(0, 0, -30)
	query := `DELETE FROM cards WHERE deleted = TRUE AND deleted_at < ?`
	result, err := r.db.Exec(query, cutoffTime)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// GetCardsDueForReview retrieves non-deleted cards that are due for review
func (r *CardRepository) GetCardsDueForReview(deckID string, currentTime int64) ([]models.Card, error) {
	var cards []models.Card
	query := `
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions, deleted, deleted_at
		FROM cards
		WHERE deck_id = ? AND deleted = FALSE AND (next_review IS NULL OR next_review <= ?)
		ORDER BY next_review ASC
	`

	err := r.db.Select(&cards, query, deckID, currentTime)
	if err != nil {
		return nil, err
	}

	return cards, nil
}
