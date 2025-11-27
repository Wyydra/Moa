package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
	"time"

	"github.com/Wyydra/Moa/backend/internal/config"
	"github.com/Wyydra/Moa/backend/internal/middleware"
	"github.com/Wyydra/Moa/backend/internal/models"
	"github.com/Wyydra/Moa/backend/internal/repository"
	"github.com/Wyydra/Moa/backend/internal/utils"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	UserRepo *repository.UserRepository
}

func NewAuthHandler(userRepo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{UserRepo: userRepo}
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

// GetMe returns the current authenticated user
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.UserRepo.GetUserByID(userID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "user not found")
		return
	}

	// Remove sensitive fields
	user.Password = nil

	utils.Success(w, user)
}

// Claims represents JWT token claims
type Claims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// generateToken creates a new JWT token for a user
func generateToken(userID int64, email string) (string, error) {
	expiryDuration, err := time.ParseDuration(config.AppConfig.JWTExpiry)
	if err != nil {
		expiryDuration = 24 * time.Hour
	}

	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiryDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "moa-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

// Register creates a new user with email/password
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" || req.Username == "" {
		utils.Error(w, http.StatusBadRequest, "email, username, and password are required")
		return
	}

	// Validate email format
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		utils.Error(w, http.StatusBadRequest, "invalid email format")
		return
	}

	// Validate password length
	if len(req.Password) < 6 {
		utils.Error(w, http.StatusBadRequest, "password must be at least 6 characters")
		return
	}

	// Check if user already exists
	existingUser, _ := h.UserRepo.GetUserByEmail(req.Email)
	if existingUser != nil {
		utils.Error(w, http.StatusConflict, "user with this email already exists")
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	hashedPasswordStr := string(hashedPassword)

	// Create user
	user := &models.User{
		Email:         req.Email,
		Username:      req.Username,
		Password:      &hashedPasswordStr,
		Provider:      "email",
		EmailVerified: false,
	}

	if err := h.UserRepo.CreateUser(user); err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	// Generate JWT
	token, err := generateToken(user.ID, user.Email)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	// Remove sensitive fields
	user.Password = nil

	utils.Success(w, AuthResponse{
		Token: token,
		User:  user,
	})
}

// Login authenticates a user with email/password
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		utils.Error(w, http.StatusBadRequest, "email and password are required")
		return
	}

	// Get user by email
	user, err := h.UserRepo.GetUserByEmail(req.Email)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "database error")
		return
	}

	if user == nil {
		utils.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	// Check if user registered with email/password
	if user.Password == nil {
		utils.Error(w, http.StatusUnauthorized, "this account uses a different login method")
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(req.Password)); err != nil {
		utils.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	// Generate JWT
	token, err := generateToken(user.ID, user.Email)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	// Remove sensitive fields
	user.Password = nil

	utils.Success(w, AuthResponse{
		Token: token,
		User:  user,
	})
}
