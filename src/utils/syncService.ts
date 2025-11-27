import { apiClient } from './api';
import { getAllDecks, getAllCards, getAllDecksIncludingDeleted, getAllCardsIncludingDeleted, saveDeck, saveCard, getDeckById, getCardsByDeck } from '../data/storage';
import { Deck, Card } from '../data/model';

export interface SyncResult {
  success: boolean;
  decksUploaded: number;
  cardsUploaded: number;
  decksDownloaded: number;
  cardsDownloaded: number;
  decksUpdated: number;
  cardsUpdated: number;
  conflictsResolved: number;
  error?: string;
}

/**
 * Synchronization Service
 * 
 * This service syncs data between local AsyncStorage and the backend API.
 * 
 * Strategy: Intelligent three-way sync with conflict resolution
 * 1. Compare local and backend data by ID
 * 2. For items that exist in both places:
 *    - Compare update timestamps (backend has updated_at, local uses createdAt)
 *    - For cards: prioritize the most recent SRS progress
 *    - For content changes: backend is authoritative
 * 3. Upload new local items
 * 4. Download new backend items
 * 5. Resolve conflicts by merging data intelligently
 */

export class SyncService {
  /**
   * Perform a full synchronization
   */
  static async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      decksUploaded: 0,
      cardsUploaded: 0,
      decksDownloaded: 0,
      cardsDownloaded: 0,
      decksUpdated: 0,
      cardsUpdated: 0,
      conflictsResolved: 0,
    };

    try {
      // Check if user is authenticated
      const token = await apiClient.getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Get all data from both sources (including soft-deleted items for sync)
      const localDecks = await getAllDecksIncludingDeleted();
      const localCards = await getAllCardsIncludingDeleted();
      
      const backendDecksResponse = await apiClient.getDecks(true); // include_deleted=true for sync
      if (backendDecksResponse.error) {
        throw new Error(`Failed to fetch backend decks: ${backendDecksResponse.error}`);
      }

      const backendDecks = backendDecksResponse.data || [];

      // Build maps for efficient lookup
      const localDeckMap = new Map(localDecks.map(d => [d.id, d]));
      const backendDeckMap = new Map(backendDecks.map((d: any) => [d.id, d]));
      
      // Sync decks
      await this.syncDecks(localDeckMap, backendDeckMap, result);

      // Sync cards for all decks
      await this.syncCards(localCards, backendDecks, result);

      result.success = true;
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Sync decks between local and backend
   */
  private static async syncDecks(
    localDeckMap: Map<string, Deck>,
    backendDeckMap: Map<string, any>,
    result: SyncResult
  ): Promise<void> {
    // Process local decks
    for (const [deckId, localDeck] of localDeckMap) {
      const backendDeck = backendDeckMap.get(deckId);

      if (!backendDeck) {
        // Deck only exists locally - upload it
        await this.uploadDeck(localDeck);
        result.decksUploaded++;
      } else {
        // Deck exists in both places - check if update needed
        // Tombstone principle: If either side is deleted, propagate the deletion
        const localDeleted = localDeck.deleted || false;
        const backendDeleted = backendDeck.deleted || false;

        if (localDeleted !== backendDeleted) {
          // One side is deleted, propagate to the other
          if (localDeleted) {
            await this.updateBackendDeck(localDeck);
            result.decksUpdated++;
          } else {
            await this.updateLocalDeck(backendDeck);
            result.decksUpdated++;
          }
        } else if (!localDeleted && !backendDeleted) {
          // Neither is deleted, check for content updates
          const backendUpdated = new Date(backendDeck.updated_at).getTime();
          const localCreated = localDeck.createdAt;

          // If backend is newer, update local
          if (backendUpdated > localCreated) {
            await this.updateLocalDeck(backendDeck);
            result.decksUpdated++;
          } else if (this.isDeckDifferent(localDeck, backendDeck)) {
            // If local has changes, update backend
            await this.updateBackendDeck(localDeck);
            result.decksUpdated++;
          }
        }
        // If both are deleted, no action needed
      }
    }

    // Process backend decks that don't exist locally
    for (const [deckId, backendDeck] of backendDeckMap) {
      if (!localDeckMap.has(deckId)) {
        await this.updateLocalDeck(backendDeck);
        result.decksDownloaded++;
      }
    }
  }

  /**
   * Sync cards between local and backend
   */
  private static async syncCards(
    localCards: Card[],
    backendDecks: any[],
    result: SyncResult
  ): Promise<void> {
    // Get all backend cards (including deleted for sync)
    const backendCardsMap = new Map<string, any>();
    
    for (const deck of backendDecks) {
      const cardsResponse = await apiClient.getCards(deck.id, true); // include_deleted=true for sync
      if (cardsResponse.data) {
        for (const card of cardsResponse.data) {
          backendCardsMap.set(card.id, card);
        }
      }
    }

    const localCardsMap = new Map(localCards.map(c => [c.id, c]));

    // Process local cards
    for (const [cardId, localCard] of localCardsMap) {
      const backendCard = backendCardsMap.get(cardId);

      if (!backendCard) {
        // Card only exists locally - upload it
        await this.uploadCard(localCard);
        result.cardsUploaded++;
      } else {
        // Card exists in both places - resolve conflict
        const needsUpdate = await this.resolveCardConflict(localCard, backendCard);
        
        if (needsUpdate === 'local') {
          await this.updateLocalCard(backendCard);
          result.cardsUpdated++;
          result.conflictsResolved++;
        } else if (needsUpdate === 'backend') {
          await this.updateBackendCard(localCard);
          result.cardsUpdated++;
          result.conflictsResolved++;
        }
      }
    }

    // Process backend cards that don't exist locally
    for (const [cardId, backendCard] of backendCardsMap) {
      if (!localCardsMap.has(cardId)) {
        await this.updateLocalCard(backendCard);
        result.cardsDownloaded++;
      }
    }
  }

  /**
   * Resolve conflict between local and backend card
   * Returns which version should be kept: 'local', 'backend', or null (no update needed)
   */
  private static async resolveCardConflict(
    localCard: Card,
    backendCard: any
  ): Promise<'local' | 'backend' | null> {
    // Tombstone principle: If either side is deleted, propagate the deletion
    const localDeleted = localCard.deleted || false;
    const backendDeleted = backendCard.deleted || false;

    if (localDeleted !== backendDeleted) {
      // One side is deleted, propagate to the other
      if (localDeleted) {
        return 'backend'; // Update backend with local deletion
      } else {
        return 'local'; // Update local with backend deletion
      }
    }

    // If both are deleted, no further sync needed
    if (localDeleted && backendDeleted) {
      return null;
    }

    const backendUpdated = new Date(backendCard.updated_at).getTime();
    const localCreated = localCard.createdAt;

    // Check if content is different
    const contentDifferent = 
      localCard.front !== backendCard.front ||
      localCard.back !== backendCard.back ||
      JSON.stringify(localCard.tags || []) !== JSON.stringify(backendCard.tags ? JSON.parse(backendCard.tags) : []);

    // Check if SRS progress is different
    const progressDifferent =
      localCard.nextReview !== (backendCard.next_review || 0) ||
      localCard.interval !== (backendCard.interval || 0) ||
      localCard.easeFactor !== (backendCard.ease_factor || 2.5) ||
      localCard.repetitions !== (backendCard.repetitions || 0);

    if (!contentDifferent && !progressDifferent) {
      return null; // No changes
    }

    // Strategy for conflict resolution:
    // 1. For SRS progress: use the most recent review (highest nextReview + highest repetitions)
    // 2. For content: backend is authoritative (newer timestamp)
    
    if (contentDifferent && backendUpdated > localCreated) {
      // Backend content is newer, but we might want to keep local SRS progress
      if (progressDifferent && localCard.repetitions > (backendCard.repetitions || 0)) {
        // Merge: backend content + local progress
        await this.mergeCard(localCard, backendCard);
        return 'backend';
      }
      return 'local'; // Update local with backend
    }

    if (contentDifferent && backendUpdated <= localCreated) {
      // Local content is newer
      return 'backend'; // Update backend with local
    }

    if (progressDifferent) {
      // Only progress is different
      if (localCard.repetitions > (backendCard.repetitions || 0)) {
        return 'backend'; // Local progress is more advanced
      } else {
        return 'local'; // Backend progress is more advanced
      }
    }

    return null;
  }

  /**
   * Merge backend content with local SRS progress
   */
  private static async mergeCard(localCard: Card, backendCard: any): Promise<void> {
    // Update backend with local SRS progress but keep backend content
    const progress = {
      next_review: localCard.nextReview,
      interval: localCard.interval,
      ease_factor: localCard.easeFactor,
      repetitions: localCard.repetitions,
    };

    await apiClient.updateCardProgress(localCard.id, progress);
  }

  /**
   * Check if deck content is different
   */
  private static isDeckDifferent(localDeck: Deck, backendDeck: any): boolean {
    return (
      localDeck.name !== backendDeck.name ||
      localDeck.description !== backendDeck.description ||
      localDeck.language !== backendDeck.language ||
      JSON.stringify(localDeck.tags || []) !== JSON.stringify(backendDeck.tags ? JSON.parse(backendDeck.tags) : []) ||
      (localDeck.deleted || false) !== (backendDeck.deleted || false)
    );
  }

  /**
   * Upload a deck to backend
   */
  private static async uploadDeck(deck: Deck): Promise<void> {
    const deckData = {
      id: deck.id,
      name: deck.name,
      description: deck.description || null,
      language: deck.language || null,
      tags: deck.tags ? JSON.stringify(deck.tags) : null,
      is_public: false,
      deleted: deck.deleted || false,
      deleted_at: deck.deletedAt ? new Date(deck.deletedAt).toISOString() : null,
    };

    await apiClient.createDeck(deckData);
  }

  /**
   * Update backend deck
   */
  private static async updateBackendDeck(deck: Deck): Promise<void> {
    const deckData = {
      name: deck.name,
      description: deck.description || null,
      language: deck.language || null,
      tags: deck.tags ? JSON.stringify(deck.tags) : null,
      deleted: deck.deleted || false,
      deleted_at: deck.deletedAt ? new Date(deck.deletedAt).toISOString() : null,
    };

    await apiClient.updateDeck(deck.id, deckData);
  }

  /**
   * Update local deck from backend
   */
  private static async updateLocalDeck(backendDeck: any): Promise<void> {
    const localDeck: Deck = {
      id: backendDeck.id,
      name: backendDeck.name,
      description: backendDeck.description,
      createdAt: new Date(backendDeck.created_at).getTime(),
      cardCount: backendDeck.card_count || 0,
      tags: backendDeck.tags ? JSON.parse(backendDeck.tags) : [],
      language: backendDeck.language,
      deleted: backendDeck.deleted || false,
      deletedAt: backendDeck.deleted_at ? new Date(backendDeck.deleted_at).getTime() : undefined,
    };

    await saveDeck(localDeck);
  }

  /**
   * Upload a card to backend
   */
  private static async uploadCard(card: Card): Promise<void> {
    const cardData = {
      id: card.id,
      deck_id: card.deckId,
      front: card.front,
      back: card.back,
      tags: card.tags ? JSON.stringify(card.tags) : null,
      next_review: card.nextReview,
      interval: card.interval,
      ease_factor: card.easeFactor,
      repetitions: card.repetitions,
      deleted: card.deleted || false,
      deleted_at: card.deletedAt ? new Date(card.deletedAt).toISOString() : null,
    };

    await apiClient.createCard(cardData);
  }

  /**
   * Update backend card
   */
  private static async updateBackendCard(card: Card): Promise<void> {
    const cardData = {
      front: card.front,
      back: card.back,
      tags: card.tags ? JSON.stringify(card.tags) : null,
      deleted: card.deleted || false,
      deleted_at: card.deletedAt ? new Date(card.deletedAt).toISOString() : null,
    };

    await apiClient.updateCard(card.id, cardData);

    // Also update progress
    const progress = {
      next_review: card.nextReview,
      interval: card.interval,
      ease_factor: card.easeFactor,
      repetitions: card.repetitions,
    };

    await apiClient.updateCardProgress(card.id, progress);
  }

  /**
   * Update local card from backend
   */
  private static async updateLocalCard(backendCard: any): Promise<void> {
    const localCard: Card = {
      id: backendCard.id,
      front: backendCard.front,
      back: backendCard.back,
      deckId: backendCard.deck_id,
      nextReview: backendCard.next_review || Date.now(),
      interval: backendCard.interval || 0,
      easeFactor: backendCard.ease_factor || 2.5,
      repetitions: backendCard.repetitions || 0,
      createdAt: new Date(backendCard.created_at).getTime(),
      tags: backendCard.tags ? JSON.parse(backendCard.tags) : [],
      deleted: backendCard.deleted || false,
      deletedAt: backendCard.deleted_at ? new Date(backendCard.deleted_at).getTime() : undefined,
    };

    await saveCard(localCard);
  }

  /**
   * Sync a single deck with its cards
   */
  static async syncDeck(deckId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      decksUploaded: 0,
      cardsUploaded: 0,
      decksDownloaded: 0,
      cardsDownloaded: 0,
      decksUpdated: 0,
      cardsUpdated: 0,
      conflictsResolved: 0,
    };

    try {
      const token = await apiClient.getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Get local deck
      const localDeck = await getDeckById(deckId);
      if (!localDeck) {
        throw new Error('Deck not found locally');
      }

      // Check if deck exists on backend
      const backendDeckResponse = await apiClient.getDeck(deckId);
      
      if (backendDeckResponse.error) {
        // Deck doesn't exist on backend, upload it
        await this.uploadDeck(localDeck);
        result.decksUploaded++;
      } else {
        // Deck exists, check if needs update
        if (this.isDeckDifferent(localDeck, backendDeckResponse.data)) {
          await this.updateBackendDeck(localDeck);
          result.decksUpdated++;
        }
      }

      // Sync cards
      const localCards = await getCardsByDeck(deckId);
      const backendCardsResponse = await apiClient.getCards(deckId);
      const backendCards = backendCardsResponse.data || [];
      const backendCardMap = new Map(backendCards.map((c: any) => [c.id, c]));

      for (const localCard of localCards) {
        const backendCard = backendCardMap.get(localCard.id);
        
        if (!backendCard) {
          await this.uploadCard(localCard);
          result.cardsUploaded++;
        } else {
          const needsUpdate = await this.resolveCardConflict(localCard, backendCard);
          
          if (needsUpdate === 'backend') {
            await this.updateBackendCard(localCard);
            result.cardsUpdated++;
            result.conflictsResolved++;
          }
        }
      }

      result.success = true;
      return result;
    } catch (error) {
      console.error('Deck sync failed:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Update card progress on backend after study session
   */
  static async syncCardProgress(cardId: string, card: Card): Promise<boolean> {
    try {
      const token = await apiClient.getToken();
      if (!token) {
        // User not authenticated, skip sync
        return false;
      }

      const progress = {
        next_review: card.nextReview,
        interval: card.interval,
        ease_factor: card.easeFactor,
        repetitions: card.repetitions,
      };

      const response = await apiClient.updateCardProgress(cardId, progress);
      return !response.error;
    } catch (error) {
      console.error('Failed to sync card progress:', error);
      return false;
    }
  }
}

export default SyncService;
