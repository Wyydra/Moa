import { initDatabase } from '../database';
import { CardRepository } from '../database/repositories/CardRepository';
import { Card, CreateCardInput } from '../model/card';

class CardService {
    async getByDeckId(deckId: number): Promise<Card[]> {
        const db = await initDatabase();
        const repository = new CardRepository(db);
        return repository.getCardsByDeckId(deckId);
    }

    async create(input: CreateCardInput): Promise<number> {
        const db = await initDatabase();
        const repository = new CardRepository(db);
        return repository.createCard(input);
    }

    async delete(id: number): Promise<void> {
        const db = await initDatabase();
        const repository = new CardRepository(db);
        return repository.deleteCard(id);
    }
}

export const cardService = new CardService();
