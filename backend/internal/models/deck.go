package models

import "time"

type Deck struct {
	ID          string     `db:"id" json:"id"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
	UserID      int64      `db:"user_id" json:"user_id"`
	Name        string     `db:"name" json:"name"`
	Description *string    `db:"description" json:"description,omitempty"`
	Language    *string    `db:"language" json:"language,omitempty"`
	Tags        *string    `db:"tags" json:"tags,omitempty"`
	CardCount   int        `db:"card_count" json:"card_count"`
	IsPublic    bool       `db:"is_public" json:"is_public"`
	Deleted     bool       `db:"deleted" json:"deleted"`
	DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}

type DeckWithCards struct {
	Deck
	Cards []Card `json:"cards"`
}
