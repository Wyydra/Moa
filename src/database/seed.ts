import { resetDatabase } from './index';
import { deckService, cardService, tagService } from '../services';

export async function seedDatabase(): Promise<void> {
  const existingDecks = await deckService.getAll();
  if (existingDecks.length > 0) {
    console.log('Database already contains data, skipping seed');
    return;
  }

  // 1. Create Tags
  const tag1Id = await tagService.create({ name: 'Important', color: '#ff5252' });
  const tag2Id = await tagService.create({ name: 'Vocabulary', color: '#448aff' });

  // 2. Create Deck
  const deckId = await deckService.create({
    name: 'First Deck',
    description: 'This is a sample deck to get you started.',
    tagIds: [tag1Id, tag2Id]
  });

  // 3. Create Cards
  const cards = [
    {
      front: 'What is this app?',
      back: 'It is a flashcard app built with React Native and clean architecture.',
      deckId: deckId,
      tagIds: [tag1Id]
    },
    {
      front: 'How do I add a card?',
      back: 'Go to the deck details and tap the + button.',
      deckId: deckId
    }
  ];

  for (const card of cards) {
    await cardService.create(card);
  }

  console.log('Database seeded successfully');
}

export async function resetAndSeed(): Promise<void> {
  await resetDatabase();
  console.log('Database cleared and schema reset');

  await seedDatabase();
}
