import { StudySession } from '../../model';
import { getDatabase } from '../connection';
import { IStudySessionRepository } from '../types';

/**
 * SQLite implementation of study session repository
 * Handles analytics and progress tracking
 */
export class StudySessionRepository implements IStudySessionRepository {
  /**
   * Get all study sessions
   */
  async getAll(): Promise<StudySession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM study_sessions ORDER BY created_at DESC');
    return rows.map(this.rowToSession);
  }

  /**
   * Get study sessions for a deck
   */
  async getByDeck(deckId: string): Promise<StudySession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      'SELECT * FROM study_sessions WHERE deck_id = ? ORDER BY created_at DESC',
      [deckId]
    );
    return rows.map(this.rowToSession);
  }

  /**
   * Get study sessions for a card
   */
  async getByCard(cardId: string): Promise<StudySession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      'SELECT * FROM study_sessions WHERE card_id = ? ORDER BY created_at DESC',
      [cardId]
    );
    return rows.map(this.rowToSession);
  }

  /**
   * Get study sessions within a date range
   */
  async getByDateRange(startDate: number, endDate: number): Promise<StudySession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      'SELECT * FROM study_sessions WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC',
      [startDate, endDate]
    );
    return rows.map(this.rowToSession);
  }

  /**
   * Create new study session
   */
  async create(session: StudySession): Promise<void> {
    const db = await getDatabase();
    const row = this.sessionToRow(session);
    
    await db.runAsync(
      `INSERT INTO study_sessions (
        id, deck_id, card_id, mode, correct, time_spent, difficulty, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id, row.deck_id, row.card_id, row.mode,
        row.correct, row.time_spent, row.difficulty, row.created_at
      ]
    );
  }

  /**
   * Batch create study sessions (optimized for study mode completion)
   */
  async batchCreate(sessions: StudySession[]): Promise<void> {
    if (sessions.length === 0) return;
    
    const db = await getDatabase();
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (const session of sessions) {
        const row = this.sessionToRow(session);
        
        await db.runAsync(
          `INSERT INTO study_sessions (
            id, deck_id, card_id, mode, correct, time_spent, difficulty, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id, row.deck_id, row.card_id, row.mode,
            row.correct, row.time_spent, row.difficulty, row.created_at
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
   * Get current study streak (consecutive days with reviews)
   */
  async getStreak(): Promise<number> {
    const db = await getDatabase();
    
    // Get distinct study dates ordered descending
    const rows = await db.getAllAsync<{ date: string }>(
      `SELECT DISTINCT date(created_at / 1000, 'unixepoch') as date
       FROM study_sessions
       ORDER BY date DESC`
    );
    
    if (rows.length === 0) return 0;
    
    // Calculate streak from consecutive days
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let expectedDate = today;
    
    for (const row of rows) {
      const studyDate = new Date(row.date);
      studyDate.setHours(0, 0, 0, 0);
      
      if (studyDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate = new Date(expectedDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Get today's review count
   */
  async getTodayReviewCount(): Promise<number> {
    const db = await getDatabase();
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM study_sessions WHERE created_at >= ?',
      [startOfDay.getTime()]
    );
    
    return result?.count || 0;
  }

  /**
   * Get this week's review count
   */
  async getWeekReviewCount(): Promise<number> {
    const db = await getDatabase();
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM study_sessions WHERE created_at >= ?',
      [startOfWeek.getTime()]
    );
    
    return result?.count || 0;
  }

  /**
   * Get overall accuracy percentage
   */
  async getOverallAccuracy(): Promise<number> {
    const db = await getDatabase();
    
    const result = await db.getFirstAsync<{ correct: number; total: number }>(
      `SELECT 
        SUM(correct) as correct,
        COUNT(*) as total
       FROM study_sessions`
    );
    
    if (!result || result.total === 0) return 0;
    
    return Math.round((result.correct / result.total) * 100);
  }

  /**
   * Helper: Convert database row to StudySession model
   */
  private rowToSession(row: any): StudySession {
    // Map database mode to StudySession response type
    let response: 'again' | 'hard' | 'good' | 'easy' = 'good';
    
    if (!row.correct) {
      response = 'again';
    } else if (row.difficulty <= 1) {
      response = 'easy';
    } else if (row.difficulty === 2) {
      response = 'good';
    } else {
      response = 'hard';
    }
    
    return {
      id: row.id,
      deckId: row.deck_id,
      cardId: row.card_id,
      timestamp: row.created_at,
      response,
      correct: row.correct === 1,
    };
  }

  /**
   * Helper: Convert StudySession model to database row
   */
  private sessionToRow(session: StudySession): Record<string, any> {
    // Map response to difficulty level
    let difficulty = 2; // default 'good'
    
    switch (session.response) {
      case 'easy':
        difficulty = 0;
        break;
      case 'good':
        difficulty = 1;
        break;
      case 'hard':
        difficulty = 2;
        break;
      case 'again':
        difficulty = 3;
        break;
    }
    
    return {
      id: session.id,
      deck_id: session.deckId,
      card_id: session.cardId,
      mode: 'learn', // Default mode, could be extended
      correct: session.correct ? 1 : 0,
      time_spent: 0, // Not tracked in current model
      difficulty,
      created_at: session.timestamp,
    };
  }
}
