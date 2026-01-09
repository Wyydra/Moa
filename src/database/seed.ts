import { getDatabase } from './index';
import * as deckService from '../services/deckService'

export async function seedDatabase(): Promise<void> {
  const existingDecks = await deckService.getAllDecks();
  if (existingDecks.length > 0) {
    console.log('Database already contains data, skipping seed');
    return
  }

  await deckService.createDeck({
    name: 'One Deck',
    description: 'nothing',
  });

  console.log('Database seeded with 1 deck');
}

export async function resetAndSeed(): Promise<void> {
  const db = getDatabase();

  await db.runAsync('DELETE FROM decks');
  await db.runAsync('DELETE FROM tags');

  console.log('Database cleared')

  await seedDatabase();
}
