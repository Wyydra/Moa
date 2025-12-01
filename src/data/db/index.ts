/**
 * Database module exports
 * Central access point for all database functionality
 */

// Connection and utilities
export { getDatabase, withTransaction, closeDatabase, getDatabaseSize } from './connection';

// Repository factory
export { RepositoryFactory } from './repositories';

// Types
export type {
  IDeckRepository,
  ICardRepository,
  IStudySessionRepository,
  DeckSummary,
  StudyStats,
} from './types';
