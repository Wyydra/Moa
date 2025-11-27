import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

/**
 * API URL is loaded from environment variables (.env file)
 * 
 * To change the backend URL:
 * 1. Edit the .env file in the project root
 * 2. Restart the dev server: npm start
 * 3. Rebuild the app: npx expo run:android or npx expo run:ios
 * 
 * Example .env configurations:
 * - Android Emulator: API_URL=http://10.0.2.2:8080/api
 * - iOS Simulator: API_URL=http://localhost:8080/api
 * - Physical Device: API_URL=http://192.168.1.12:8080/api
 */
const API_BASE_URL = API_URL || 'http://10.0.2.2:8080/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'An error occurred',
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth endpoints
  async register(email: string, username: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.post('/auth/register', { email, username, password });
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.post('/auth/login', { email, password });
  }

  async getMe(): Promise<ApiResponse<any>> {
    return this.get('/me');
  }

  // Deck endpoints
  async getDecks(includeDeleted: boolean = false): Promise<ApiResponse<any[]>> {
    const query = includeDeleted ? '?include_deleted=true' : '';
    return this.get(`/decks${query}`);
  }

  async getDeck(id: string): Promise<ApiResponse<any>> {
    return this.get(`/decks/${id}`);
  }

  async createDeck(deck: any): Promise<ApiResponse<any>> {
    return this.post('/decks', deck);
  }

  async updateDeck(id: string, deck: any): Promise<ApiResponse<any>> {
    return this.put(`/decks/${id}`, deck);
  }

  async deleteDeck(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/decks/${id}`);
  }

  // Card endpoints
  async getCards(deckId: string, includeDeleted: boolean = false): Promise<ApiResponse<any[]>> {
    const query = includeDeleted ? '?include_deleted=true' : '';
    return this.get(`/decks/${deckId}/cards${query}`);
  }

  async getCard(id: string): Promise<ApiResponse<any>> {
    return this.get(`/cards/${id}`);
  }

  async createCard(card: any): Promise<ApiResponse<any>> {
    return this.post('/cards', card);
  }

  async updateCard(id: string, card: any): Promise<ApiResponse<any>> {
    return this.put(`/cards/${id}`, card);
  }

  async deleteCard(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/cards/${id}`);
  }

  async updateCardProgress(id: string, progress: any): Promise<ApiResponse<any>> {
    return this.put(`/cards/${id}/progress`, progress);
  }

  async getDueCards(deckId: string): Promise<ApiResponse<any[]>> {
    return this.get(`/decks/${deckId}/cards/due`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiResponse };
