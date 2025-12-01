import { Card } from '../../model';
import { getDatabase, cardToRow, rowToCard } from '../connection';
import { ICardRepository } from '../types';

/**
 * SQLite implementation of card repository
 * Handles all card-related database operations with optimized queries
 */
export class CardRepository implements ICardRepository {
  /**
   * Get card by ID
   */
  async getById(id: string): Promise<Card | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync('SELECT * FROM cards WHERE id = ?', [id]);
    return row ? rowToCard(row) : null;
  }

  /**
   * Get all cards in a deck
   */
  async getByDeck(deckId: string): Promise<Card[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at DESC', [deckId]);
    return rows.map(rowToCard);
  }

  /**
   * Get due cards for a deck (cards that need review)
   */
  async getDueCards(deckId: string): Promise<Card[]> {
    const db = await getDatabase();
    const now = Date.now();
    
    const rows = await db.getAllAsync(
      'SELECT * FROM cards WHERE deck_id = ? AND next_review <= ? ORDER BY next_review ASC',
      [deckId, now]
    );
    
    return rows.map(rowToCard);
  }

  /**
   * Get due cards by tags (not implemented in current schema)
   */
  async getDueCardsByTags(tags: string[]): Promise<Card[]> {
    // Note: Card tags not in current schema, using deck-level filtering
    if (tags.length === 0) return [];
    
    const db = await getDatabase();
    const now = Date.now();
    
    // Get cards from decks with matching tags
    const rows = await db.getAllAsync(
      `SELECT c.* FROM cards c
       JOIN decks d ON c.deck_id = d.id
       WHERE c.next_review <= ? AND d.tags LIKE ?
       ORDER BY c.next_review ASC`,
      [now, tags.map(tag => `%"${tag}"%`).join('|')]
    );
    
    return rows.map(rowToCard);
  }

  /**
   * Get cards by tags
   */
  async getCardsByTags(tags: string[]): Promise<Card[]> {
    if (tags.length === 0) return [];
    
    const db = await getDatabase();
    
    // Get cards from decks with matching tags
    const rows = await db.getAllAsync(
      `SELECT c.* FROM cards c
       JOIN decks d ON c.deck_id = d.id
       WHERE d.tags LIKE ?
       ORDER BY c.created_at DESC`,
      [tags.map(tag => `%"${tag}"%`).join('|')]
    );
    
    return rows.map(rowToCard);
  }

  /**
   * Create new card
   */
  async create(card: Card): Promise<void> {
    const db = await getDatabase();
    const row = cardToRow(card);
    
    await db.runAsync(
      `INSERT INTO cards (
        id, deck_id, front, back, pronunciation, difficulty,
        last_reviewed, next_review, review_count, correct_count, incorrect_count,
        ease_factor, interval, stroke_order_data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id, row.deck_id, row.front, row.back, row.pronunciation, row.difficulty,
        row.last_reviewed, row.next_review, row.review_count, row.correct_count, row.incorrect_count,
        row.ease_factor, row.interval, row.stroke_order_data, row.created_at, row.updated_at
      ]
    );
  }

  /**
   * Update existing card
   */
  async update(card: Card): Promise<void> {
    const db = await getDatabase();
    const row = cardToRow(card);
    
    await db.runAsync(
      `UPDATE cards SET
        front = ?, back = ?, pronunciation = ?, difficulty = ?,
        last_reviewed = ?, next_review = ?, review_count = ?, correct_count = ?, incorrect_count = ?,
        ease_factor = ?, interval = ?, stroke_order_data = ?, updated_at = ?
      WHERE id = ?`,
      [
        row.front, row.back, row.pronunciation, row.difficulty,
        row.last_reviewed, row.next_review, row.review_count, row.correct_count, row.incorrect_count,
        row.ease_factor, row.interval, row.stroke_order_data, row.updated_at, row.id
      ]
    );
  }

  /**
   * Batch update multiple cards in a single transaction
   * Much faster than individual updates for study sessions
   */
  async batchUpdate(cards: Card[]): Promise<void> {
    if (cards.length === 0) return;
    
    const db = await getDatabase();
    
    // Use transaction for atomic batch update
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (const card of cards) {
        const row = cardToRow(card);
        
        await db.runAsync(
          `UPDATE cards SET
            front = ?, back = ?, pronunciation = ?, difficulty = ?,
            last_reviewed = ?, next_review = ?, review_count = ?, correct_count = ?, incorrect_count = ?,
            ease_factor = ?, interval = ?, stroke_order_data = ?, updated_at = ?
          WHERE id = ?`,
          [
            row.front, row.back, row.pronunciation, row.difficulty,
            row.last_reviewed, row.next_review, row.review_count, row.correct_count, row.incorrect_count,
            row.ease_factor, row.interval, row.stroke_order_data, row.updated_at, row.id
          ]
        );
      }
      
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Delete card
   */
  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
  }

  /**
   * Move cards to another deck (bulk operation)
   */
  async moveToAnotherDeck(cardIds: string[], targetDeckId: string): Promise<void> {
    if (cardIds.length === 0) return;
    
    const db = await getDatabase();
    const placeholders = cardIds.map(() => '?').join(',');
    
    await db.runAsync(
      `UPDATE cards SET deck_id = ?, updated_at = ? WHERE id IN (${placeholders})`,
      [targetDeckId, Date.now(), ...cardIds]
    );
  }

  /**
   * Get card count for a deck
   */
  async getCardCount(deckId: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM cards WHERE deck_id = ?',
      [deckId]
    );
    return result?.count || 0;
  }

  /**
   * Get due card count for a deck
   */
  async getDueCount(deckId: string): Promise<number> {
    const db = await getDatabase();
    const now = Date.now();
    
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND next_review <= ?',
      [deckId, now]
    );
    return result?.count || 0;
  }

  /**
   * Get total card count across all decks
   */
  async getTotalCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
    return result?.count || 0;
  }
}
