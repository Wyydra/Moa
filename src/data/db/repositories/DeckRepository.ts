import { Deck } from '../../model';
import { getDatabase, deckToRow, rowToDeck } from '../connection';
import { IDeckRepository, DeckSummary } from '../types';

/**
 * SQLite implementation of deck repository
 * Handles all deck-related database operations
 */
export class DeckRepository implements IDeckRepository {
  /**
   * Get all decks
   */
  async getAll(): Promise<Deck[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM decks ORDER BY updated_at DESC');
    return rows.map(rowToDeck);
  }

  /**
   * Get deck by ID
   */
  async getById(id: string): Promise<Deck | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync('SELECT * FROM decks WHERE id = ?', [id]);
    return row ? rowToDeck(row) : null;
  }

  /**
   * Get deck summary with statistics
   */
  async getDeckSummary(id: string): Promise<DeckSummary | null> {
    const db = await getDatabase();
    const now = Date.now();
    
    const row = await db.getFirstAsync<any>(`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.source_language as language,
        d.tags,
        d.created_at,
        COUNT(c.id) as card_count,
        SUM(CASE WHEN c.next_review IS NOT NULL AND c.next_review <= ? THEN 1 ELSE 0 END) as due_count,
        MIN(CASE WHEN c.next_review > ? THEN c.next_review ELSE NULL END) as next_due_date
      FROM decks d
      LEFT JOIN cards c ON d.id = c.deck_id
      WHERE d.id = ?
      GROUP BY d.id
    `, [now, now, id]);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      createdAt: row.created_at,
      cardCount: row.card_count || 0,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      language: row.language || undefined,
      dueCount: row.due_count || 0,
      nextDueDate: row.next_due_date || null,
    };
  }

  /**
   * Get decks by tags (ANY of the provided tags)
   */
  async getByTags(tags: string[]): Promise<Deck[]> {
    if (tags.length === 0) return [];
    
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      'SELECT * FROM decks WHERE tags LIKE ? ORDER BY updated_at DESC',
      [tags.map(tag => `%"${tag}"%`).join('|')]
    );
    
    return rows.map(rowToDeck);
  }

  /**
   * Get total deck count
   */
  async getTotalCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM decks');
    return result?.count || 0;
  }

  /**
   * Get all unique tags across all decks
   */
  async getAllTags(): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ tags: string }>('SELECT tags FROM decks WHERE tags != "[]"');
    
    const allTags = new Set<string>();
    rows.forEach(row => {
      const tags = JSON.parse(row.tags);
      tags.forEach((tag: string) => allTags.add(tag));
    });
    
    return Array.from(allTags).sort();
  }

  /**
   * Create new deck
   */
  async create(deck: Deck): Promise<void> {
    const db = await getDatabase();
    const row = deckToRow(deck);
    
    await db.runAsync(
      `INSERT INTO decks (
        id, name, description, source_language, target_language, 
        category, tags, is_public, shared_by, total_cards, mastered_cards,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id, row.name, row.description, row.source_language, row.target_language,
        row.category, row.tags, row.is_public, row.shared_by, row.total_cards, row.mastered_cards,
        row.created_at, row.updated_at
      ]
    );
  }

  /**
   * Update existing deck
   */
  async update(deck: Deck): Promise<void> {
    const db = await getDatabase();
    const row = deckToRow(deck);
    
    await db.runAsync(
      `UPDATE decks SET 
        name = ?, description = ?, source_language = ?, target_language = ?,
        category = ?, tags = ?, is_public = ?, shared_by = ?,
        total_cards = ?, mastered_cards = ?, updated_at = ?
      WHERE id = ?`,
      [
        row.name, row.description, row.source_language, row.target_language,
        row.category, row.tags, row.is_public, row.shared_by,
        row.total_cards, row.mastered_cards, row.updated_at, row.id
      ]
    );
  }

  /**
   * Delete deck and all its cards (CASCADE)
   */
  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM decks WHERE id = ?', [id]);
  }

  /**
   * Update deck card counts (call after card operations)
   */
  async updateCardCounts(deckId: string): Promise<void> {
    const db = await getDatabase();
    
    await db.runAsync(
      `UPDATE decks SET 
        total_cards = (SELECT COUNT(*) FROM cards WHERE deck_id = ?),
        mastered_cards = (SELECT COUNT(*) FROM cards WHERE deck_id = ? AND ease_factor >= 2.5 AND interval >= 21),
        updated_at = ?
      WHERE id = ?`,
      [deckId, deckId, Date.now(), deckId]
    );
  }

  /**
   * Search decks by name or tags
   */
  async search(query: string): Promise<Deck[]> {
    const db = await getDatabase();
    const searchPattern = `%${query}%`;
    
    const rows = await db.getAllAsync(
      `SELECT * FROM decks 
       WHERE name LIKE ? OR tags LIKE ?
       ORDER BY updated_at DESC`,
      [searchPattern, searchPattern]
    );
    
    return rows.map(rowToDeck);
  }
}
