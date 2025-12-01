/**
 * Database-specific types and interfaces for SQLite operations
 */

import { Card, Deck, StudySession } from '../model';

// Database result types
export interface SQLResultSet {
  rows: {
    length: number;
    item: (index: number) => any;
    _array: any[];
  };
  insertId?: number;
  rowsAffected: number;
}

// Transaction callback type
export type TransactionCallback = (transaction: SQLTransaction) => Promise<void>;

// SQL Transaction interface
export interface SQLTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
    errorCallback?: (transaction: SQLTransaction, error: Error) => boolean
  ) => void;
}

// Repository interfaces

export interface IDeckRepository {
  // Read operations
  getAll(): Promise<Deck[]>;
  getById(id: string): Promise<Deck | null>;
  getByTags(tags: string[]): Promise<Deck[]>;
  getDeckSummary(id: string): Promise<DeckSummary | null>;
  
  // Write operations
  create(deck: Deck): Promise<void>;
  update(deck: Deck): Promise<void>;
  delete(id: string): Promise<void>;
  updateCardCounts(deckId: string): Promise<void>;
  
  // Analytics
  getTotalCount(): Promise<number>;
  getAllTags(): Promise<string[]>;
}

export interface ICardRepository {
  // Read operations
  getById(id: string): Promise<Card | null>;
  getByDeck(deckId: string): Promise<Card[]>;
  getDueCards(deckId: string): Promise<Card[]>;
  getDueCardsByTags(tags: string[]): Promise<Card[]>;
  getCardsByTags(tags: string[]): Promise<Card[]>;
  
  // Write operations
  create(card: Card): Promise<void>;
  update(card: Card): Promise<void>;
  batchUpdate(cards: Card[]): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Complex operations
  moveToAnotherDeck(cardIds: string[], targetDeckId: string): Promise<void>;
  
  // Analytics
  getCardCount(deckId: string): Promise<number>;
  getDueCount(deckId: string): Promise<number>;
  getTotalCount(): Promise<number>;
}

export interface IStudySessionRepository {
  // Read operations
  getAll(): Promise<StudySession[]>;
  getByDeck(deckId: string): Promise<StudySession[]>;
  getByCard(cardId: string): Promise<StudySession[]>;
  getByDateRange(startDate: number, endDate: number): Promise<StudySession[]>;
  
  // Write operations
  create(session: StudySession): Promise<void>;
  batchCreate(sessions: StudySession[]): Promise<void>;
  
  // Analytics
  getStreak(): Promise<number>;
  getTodayReviewCount(): Promise<number>;
  getWeekReviewCount(): Promise<number>;
  getOverallAccuracy(): Promise<number>;
}

// Extended types for analytics
export interface DeckSummary {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  cardCount: number;
  tags?: string[];
  language?: string;
  dueCount: number;
  nextDueDate: number | null;
}

export interface StudyStats {
  streak: number;
  todayReviews: number;
  weekReviews: number;
  accuracy: number;
}
