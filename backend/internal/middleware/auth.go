package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/Wyydra/Moa/backend/internal/config"
	"github.com/Wyydra/Moa/backend/internal/utils"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userIDKey contextKey = "userID"

var (
	ErrMissingAuthHeader = errors.New("missing authorization header")
	ErrInvalidAuthFormat = errors.New("invalid authorization header format")
	ErrInvalidToken      = errors.New("invalid token")
	ErrInvalidClaims     = errors.New("invalid token claims")
)

// Auth validates JWT tokens and adds userID to request context
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := extractUserID(r)
		if err != nil {
			utils.Error(w, http.StatusUnauthorized, err.Error())
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// extractUserID extracts and validates the user ID from the JWT token
func extractUserID(r *http.Request) (int64, error) {
	tokenString, err := extractToken(r)
	if err != nil {
		return 0, err
	}

	token, err := parseToken(tokenString)
	if err != nil {
		return 0, err
	}

	return getUserIDFromToken(token)
}

// extractToken extracts the JWT token from the Authorization header
func extractToken(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", ErrMissingAuthHeader
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", ErrInvalidAuthFormat
	}

	return parts[1], nil
}

// parseToken parses and validates the JWT token
func parseToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	return token, nil
}

// getUserIDFromToken extracts the user ID from the token claims
func getUserIDFromToken(token *jwt.Token) (int64, error) {
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, ErrInvalidClaims
	}

	userID, ok := claims["user_id"].(float64)
	if !ok {
		return 0, ErrInvalidClaims
	}

	return int64(userID), nil
}

// GetUserID retrieves the user ID from the request context
func GetUserID(r *http.Request) (int64, bool) {
	userID, ok := r.Context().Value(userIDKey).(int64)
	return userID, ok
}
