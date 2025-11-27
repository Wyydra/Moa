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
		INSERT INTO cards (id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
		INSERT INTO cards (id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
		)
		if err != nil {
			return err
		}
		cards[i].CreatedAt = now
		cards[i].UpdatedAt = now
	}

	return tx.Commit()
}

// GetCardsByDeckID retrieves all cards for a specific deck
func (r *CardRepository) GetCardsByDeckID(deckID string) ([]models.Card, error) {
	var cards []models.Card
	query := `
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions
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

// GetCardByID retrieves a single card by ID
func (r *CardRepository) GetCardByID(cardID string) (*models.Card, error) {
	var card models.Card
	query := `
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions
		FROM cards
		WHERE id = ?
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
		SET updated_at = ?, front = ?, back = ?, tags = ?, next_review = ?, interval = ?, ease_factor = ?, repetitions = ?
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

// DeleteCard deletes a single card
func (r *CardRepository) DeleteCard(cardID string) error {
	query := `DELETE FROM cards WHERE id = ?`
	_, err := r.db.Exec(query, cardID)
	return err
}

// DeleteCardsByDeckID deletes all cards in a deck
func (r *CardRepository) DeleteCardsByDeckID(deckID string) error {
	query := `DELETE FROM cards WHERE deck_id = ?`
	_, err := r.db.Exec(query, deckID)
	return err
}

// GetCardsDueForReview retrieves cards that are due for review
func (r *CardRepository) GetCardsDueForReview(deckID string, currentTime int64) ([]models.Card, error) {
	var cards []models.Card
	query := `
		SELECT id, created_at, updated_at, deck_id, front, back, tags, next_review, interval, ease_factor, repetitions
		FROM cards
		WHERE deck_id = ? AND (next_review IS NULL OR next_review <= ?)
		ORDER BY next_review ASC
	`

	err := r.db.Select(&cards, query, deckID, currentTime)
	if err != nil {
		return nil, err
	}

	return cards, nil
}
