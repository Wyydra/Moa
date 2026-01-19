import { initDatabase } from '../database';
import { DeckRepository } from '../database/repositories/DeckRepository';
import { CreateDeckInput, Deck } from '../model/deck';

class DeckService {
    async getAll(): Promise<Deck[]> {
        const db = await initDatabase();
        const repository = new DeckRepository(db);
        return repository.getDecks();
    }

    async getById(id: number): Promise<Deck | null> {
        const db = await initDatabase();
        const repository = new DeckRepository(db);
        return repository.getDeckById(id);
    }

    async create(input: CreateDeckInput): Promise<number> {
        const db = await initDatabase();
        const repository = new DeckRepository(db);
        return repository.createDeck(input);
    }

    async update(id: number, input: Partial<CreateDeckInput>): Promise<void> {
        const db = await initDatabase();
        const repository = new DeckRepository(db);
        return repository.updateDeck(id, input);
    }

    async delete(id: number): Promise<void> {
        const db = await initDatabase();
        const repository = new DeckRepository(db);
        return repository.deleteDeck(id);
    }
}

export const deckService = new DeckService();
