package models

import "time"

type Card struct {
	ID          string     `db:"id" json:"id"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
	DeckID      string     `db:"deck_id" json:"deck_id"`
	Front       string     `db:"front" json:"front"`
	Back        string     `db:"back" json:"back"`
	Tags        *string    `db:"tags" json:"tags,omitempty"`
	NextReview  *int64     `db:"next_review" json:"next_review,omitempty"`
	Interval    *int       `db:"interval" json:"interval,omitempty"`
	EaseFactor  *float64   `db:"ease_factor" json:"ease_factor,omitempty"`
	Repetitions *int       `db:"repetitions" json:"repetitions,omitempty"`
	Deleted     bool       `db:"deleted" json:"deleted"`
	DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}
