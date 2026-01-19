import { SQLiteDatabase } from 'expo-sqlite';
import { Card, CreateCardInput } from '../../model/card';
import { Tag } from '../../model/tag';

export class CardRepository {
    constructor(private db: SQLiteDatabase) { }

    async createCard(input: CreateCardInput): Promise<number> {
        let cardId: number = 0;
        await this.db.withTransactionAsync(async () => {
            const result = await this.db.runAsync(
                'INSERT INTO card (front, back, deck_id) VALUES (?, ?, ?)',
                input.front,
                input.back,
                input.deckId
            );
            cardId = result.lastInsertRowId;

            if (input.tagIds && input.tagIds.length > 0) {
                for (const tagId of input.tagIds) {
                    await this.db.runAsync(
                        'INSERT INTO card_tag (card_id, tag_id) VALUES (?, ?)',
                        cardId,
                        tagId
                    );
                }
            }
        });

        return cardId;
    }

    async getCardsByDeckId(deckId: number): Promise<Card[]> {
        // Fetch cards first
        const rows = await this.db.getAllAsync<{
            id: number;
            front: string;
            back: string;
            deck_id: number;
            created_at: string;
        }>(
            'SELECT * FROM card WHERE deck_id = ? ORDER BY created_at ASC',
            deckId
        );

        const cards: Card[] = [];
        for (const row of rows) {
            const tags = await this.db.getAllAsync<Tag>(`
          SELECT t.* FROM tag t
          INNER JOIN card_tag ct ON ct.tag_id = t.id
          WHERE ct.card_id = ?
        `, row.id);

            cards.push({
                id: row.id,
                front: row.front,
                back: row.back,
                deckId: row.deck_id,
                createdAt: row.created_at,
                tags: tags
            });
        }

        return cards;
    }

    async deleteCard(id: number): Promise<void> {
        await this.db.runAsync('DELETE FROM card WHERE id = ?', id);
    }
}
