package repository

import (
	"database/sql"
	"time"

	"github.com/Wyydra/Moa/backend/internal/database"
	"github.com/Wyydra/Moa/backend/internal/models"
)

type UserRepository struct {
	db *database.Database
}

func NewUserRepository(db *database.Database) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser inserts a new user into the database
func (r *UserRepository) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (created_at, updated_at, email, username, password, provider)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := r.db.Exec(
		query,
		now,
		now,
		user.Email,
		user.Username,
		user.Password,
		user.Provider,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	user.ID = id
	user.CreatedAt = now
	user.UpdatedAt = now
	return nil
}

// GetUserByEmail retrieves a user by email address
func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, created_at, updated_at, email, username, password, 
		       provider, email_verified, verify_token, reset_token, reset_expiry, avatar
		FROM users
		WHERE email = ?
	`

	err := r.db.Get(&user, query, email)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserByID retrieves a user by their ID
func (r *UserRepository) GetUserByID(id int64) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, created_at, updated_at, email, username, password,
		       provider, email_verified, verify_token, reset_token, reset_expiry, avatar
		FROM users
		WHERE id = ?
	`

	err := r.db.Get(&user, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateUser updates an existing user's information
func (r *UserRepository) UpdateUser(user *models.User) error {
	query := `
		UPDATE users
		SET updated_at = ?, username = ?, email_verified = ?, avatar = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := r.db.Exec(
		query,
		now,
		user.Username,
		user.EmailVerified,
		user.Avatar,
		user.ID,
	)
	if err != nil {
		return err
	}

	user.UpdatedAt = now
	return nil
}

// SetResetToken sets a password reset token for a user
func (r *UserRepository) SetResetToken(userID int64, token string, expiry time.Time) error {
	query := `
		UPDATE users
		SET reset_token = ?, reset_expiry = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, token, expiry, time.Now(), userID)
	return err
}

// ClearResetToken clears the password reset token
func (r *UserRepository) ClearResetToken(userID int64) error {
	query := `
		UPDATE users
		SET reset_token = NULL, reset_expiry = NULL, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, time.Now(), userID)
	return err
}

// UpdatePassword updates a user's password
func (r *UserRepository) UpdatePassword(userID int64, hashedPassword string) error {
	query := `
		UPDATE users
		SET password = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, hashedPassword, time.Now(), userID)
	return err
}

// VerifyEmail marks a user's email as verified
func (r *UserRepository) VerifyEmail(userID int64) error {
	query := `
		UPDATE users
		SET email_verified = TRUE, verify_token = NULL, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, time.Now(), userID)
	return err
}
