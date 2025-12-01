/**
 * Repository exports and factory
 * Provides centralized access to all database repositories
 */

export { DeckRepository } from './DeckRepository';
export { CardRepository } from './CardRepository';
export { StudySessionRepository } from './StudySessionRepository';

import { DeckRepository } from './DeckRepository';
import { CardRepository } from './CardRepository';
import { StudySessionRepository } from './StudySessionRepository';
import { IDeckRepository, ICardRepository, IStudySessionRepository } from '../types';

/**
 * Repository factory for dependency injection
 * Makes it easy to swap implementations for testing or future API backend
 */
export class RepositoryFactory {
  private static deckRepo: IDeckRepository | null = null;
  private static cardRepo: ICardRepository | null = null;
  private static sessionRepo: IStudySessionRepository | null = null;

  /**
   * Get deck repository instance (singleton)
   */
  static getDeckRepository(): IDeckRepository {
    if (!this.deckRepo) {
      this.deckRepo = new DeckRepository();
    }
    return this.deckRepo;
  }

  /**
   * Get card repository instance (singleton)
   */
  static getCardRepository(): ICardRepository {
    if (!this.cardRepo) {
      this.cardRepo = new CardRepository();
    }
    return this.cardRepo;
  }

  /**
   * Get study session repository instance (singleton)
   */
  static getStudySessionRepository(): IStudySessionRepository {
    if (!this.sessionRepo) {
      this.sessionRepo = new StudySessionRepository();
    }
    return this.sessionRepo;
  }

  /**
   * Reset all repositories (for testing)
   */
  static reset(): void {
    this.deckRepo = null;
    this.cardRepo = null;
    this.sessionRepo = null;
  }

  /**
   * Set custom implementations (for testing/mocking)
   */
  static setRepositories(
    deckRepo?: IDeckRepository,
    cardRepo?: ICardRepository,
    sessionRepo?: IStudySessionRepository
  ): void {
    if (deckRepo) this.deckRepo = deckRepo;
    if (cardRepo) this.cardRepo = cardRepo;
    if (sessionRepo) this.sessionRepo = sessionRepo;
  }
}
