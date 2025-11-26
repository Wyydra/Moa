package models

import "time"

type User struct {
	ID int64 `db:"id" json: "id"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
	Email string `db:"email" json:"email"`
	Username string `db:"username" json:"username"`
	Password      *string    `db:"password" json:"-"` // Nullable for OAuth users
	GoogleID      *string    `db:"google_id" json:"-"`
	Provider      string     `db:"provider" json:"provider"`
	EmailVerified bool       `db:"email_verified" json:"email_verified"`
	VerifyToken   *string    `db:"verify_token" json:"-"`
	ResetToken    *string    `db:"reset_token" json:"-"`
	ResetExpiry   *time.Time `db:"reset_expiry" json:"-"`
	Avatar        *string    `db:"avatar" json:"avatar,omitempty"`
}
