import { SQLiteDatabase } from 'expo-sqlite';
import { CreateDeckInput, Deck } from '../../model/deck';
import { Tag } from '../../model/tag';

export class DeckRepository {
    constructor(private db: SQLiteDatabase) { }

    async createDeck(input: CreateDeckInput): Promise<number> {
        let deckId: number = 0;
        await this.db.withTransactionAsync(async () => {
            const result = await this.db.runAsync(
                'INSERT INTO deck (name, description) VALUES (?, ?)',
                input.name,
                input.description ?? null
            );

            deckId = result.lastInsertRowId;

            if (input.tagIds && input.tagIds.length > 0) {
                for (const tagId of input.tagIds) {
                    await this.db.runAsync(
                        'INSERT INTO deck_tag (deck_id, tag_id) VALUES (?, ?)',
                        deckId,
                        tagId
                    );
                }
            }
        });
        return deckId;
    }

    async getDecks(): Promise<Deck[]> {
        const rows = await this.db.getAllAsync<{
            id: number;
            name: string;
            description: string | null;
            created_at: string;
            updated_at: string;
            card_count: number;
        }>(`
      SELECT 
        d.*, 
        (SELECT COUNT(*) FROM card c WHERE c.deck_id = d.id) as card_count 
      FROM deck d 
      ORDER BY d.updated_at DESC
    `);

        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            cardCount: row.card_count,
        }));
    }

    async getDeckById(id: number): Promise<Deck | null> {
        const row = await this.db.getFirstAsync<{
            id: number;
            name: string;
            description: string | null;
            created_at: string;
            updated_at: string;
        }>(
            'SELECT * FROM deck WHERE id = ?',
            id
        );

        if (!row) return null;

        // Get tags
        const tags = await this.db.getAllAsync<Tag>(`
      SELECT t.* FROM tag t
      INNER JOIN deck_tag dt ON dt.tag_id = t.id
      WHERE dt.deck_id = ?
    `, id);

        const cardCountResult = await this.db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM card WHERE deck_id = ?',
            id
        );


        return {
            id: row.id,
            name: row.name,
            description: row.description ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            cardCount: cardCountResult?.count ?? 0,
            tags: tags,
        };
    }

    async deleteDeck(id: number): Promise<void> {
        await this.db.runAsync('DELETE FROM deck WHERE id = ?', id);
    }

    async updateDeck(id: number, input: Partial<CreateDeckInput>): Promise<void> {
        await this.db.withTransactionAsync(async () => {
            if (input.name) {
                await this.db.runAsync('UPDATE deck SET name = ? WHERE id = ?', input.name, id);
            }
            if (input.description !== undefined) {
                await this.db.runAsync('UPDATE deck SET description = ? WHERE id = ?', input.description, id);
            }

            if (input.tagIds) {
                // Get current tags
                const currentTags = await this.db.getAllAsync<{ tag_id: number }>(
                    'SELECT tag_id FROM deck_tag WHERE deck_id = ?',
                    id
                );
                const currentTagIds = new Set(currentTags.map(t => t.tag_id));
                const newTagIds = new Set(input.tagIds);

                // Tags to remove (in current but not in new)
                const toRemove = [...currentTagIds].filter(tagId => !newTagIds.has(tagId));

                // Tags to add (in new but not in current)
                const toAdd = [...newTagIds].filter(tagId => !currentTagIds.has(tagId));

                for (const tagId of toRemove) {
                    await this.db.runAsync(
                        'DELETE FROM deck_tag WHERE deck_id = ? AND tag_id = ?',
                        id,
                        tagId
                    );
                }

                for (const tagId of toAdd) {
                    await this.db.runAsync(
                        'INSERT INTO deck_tag (deck_id, tag_id) VALUES (?, ?)',
                        id,
                        tagId
                    );
                }
            }
        });
    }
}
