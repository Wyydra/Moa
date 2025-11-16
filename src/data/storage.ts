import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Deck } from "./model";

const DECKS_KEY = '@moa_decks';
const CARDS_KEY = '@moa_cards';
const LANGUAGE_PREF_KEY = '@moa_language_preference';
const HANDWRITING_LANG_KEY = '@moa_handwriting_language';

export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2,9);
};

export const saveDeck = async (deck: Deck): Promise<void> => {
  try {
    const decks = await getAllDecks();
    const existingIndex = decks.findIndex(d => d.id === deck.id);

    if (existingIndex >= 0) {
      decks[existingIndex] = deck;
    } else {
      decks.push(deck);
    }

    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error('Error saving deck:', error);
    throw error;
  }
};

export const getAllDecks = async (): Promise<Deck[]> => {
  try {
    const data = await AsyncStorage.getItem(DECKS_KEY);
    return data ? JSON.parse(data): [];
  } catch (error) {
    console.error('Error loading decks:', error);
    return [];
  }
}

export const getDeckById = async (deckId: string): Promise<Deck | null> => {
  try {
    const decks = await getAllDecks();
    return decks.find(d => d.id === deckId) || null;
  } catch (error) {
    console.error('Error loading deck:', error);
    return null;
  }
};

export const deleteDeck = async (deckId: string): Promise<void> => {
  try {
    const decks = await getAllDecks();
    const filtered = decks.filter(d => d.id !== deckId);
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(filtered));

    const cards = await getAllCards();
    const filteredCards = cards.filter(c => c.deckId !== deckId);
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filteredCards));
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
};

export const saveCard = async (card: Card): Promise<void> => {
  try {
    const cards = await getAllCards();
    const existingIndex = cards.findIndex(c => c.id === card.id);

    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }

    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));

    await updateDeckCardCount(card.deckId);
  } catch (error) {
    console.error('Error saving card:', error);
    throw error;
  }
};

export const getAllCards = async (): Promise<Card[]> => {
  try {
    const data = await AsyncStorage.getItem(CARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading cards:', error);
    return [];
  }
};

export const getCardsByDeck = async (deckId: string): Promise<Card[]> => {
  try {
    const cards = await getAllCards();
    return cards.filter(c => c.deckId === deckId);
  } catch (error) {
    console.error('Error loading cards for deck:', error);
    return [];
  }
};

export const getDueCards = async (deckId: string): Promise<Card[]> => {
  try {
    const cards = await getCardsByDeck(deckId);
    const now = Date.now();
    return cards.filter(c => c.nextReview <= now);
  } catch (error) {
    console.error('Error loading due cards:', error);
    return [];
  }
}

export const getDueCardsByTags = async (tags: string[]): Promise<Card[]> => {
  try {
    const deckIds = (await getDecksByTags(tags)).map(d => d.id);
    const allCards = await getAllCards();
    const now = Date.now();
    return allCards.filter(c => deckIds.includes(c.deckId) && c.nextReview <= now);
  } catch (error) {
    console.error('Error loading due cards by tags:', error);
    return [];
  }
}

export const getCardsByTags = async (tags: string[]): Promise<Card[]> => {
  try {
    const deckIds = (await getDecksByTags(tags)).map(d => d.id);
    const allCards = await getAllCards();
    return allCards.filter(c => deckIds.includes(c.deckId));
  } catch (error) {
    console.error('Error loading cards by tags:', error);
    return [];
  }
}

export const deleteCard = async (cardId: string): Promise<void> => {
  try {
    const cards = await getAllCards();
    const card = cards.find(c => c.id === cardId);
    const filtered = cards.filter(c => c.id !== cardId);
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filtered));

    if (card) {
      await updateDeckCardCount(card.deckId);
    }
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
};

const updateDeckCardCount = async (deckId: string): Promise<void> => {
  try {
    const cards = await getCardsByDeck(deckId);
    const deck = await getDeckById(deckId);

    if (deck) {
      deck.cardCount = cards.length;
      await saveDeck(deck);
    }
  } catch (error) {
    console.error('Error updating deck card count:', error);
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([DECKS_KEY, CARDS_KEY]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

export const seedTestData = async (): Promise<void> => {
  const testDecksData = require('../../test-decks.json');
  const now = Date.now();

  const decks: Deck[] = [];
  const cards: Card[] = [];

  testDecksData.decks.forEach((deckData: any, index: number) => {
    const deckId = generateId();
    
    decks.push({
      id: deckId,
      name: deckData.name,
      description: deckData.description,
      tags: deckData.tags,
      createdAt: now + (index * 1000),
      cardCount: deckData.cards.length
    });

    deckData.cards.forEach((cardData: any) => {
      cards.push({
        id: generateId(),
        front: cardData.front,
        back: cardData.back,
        deckId: deckId,
        nextReview: now,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: now
      });
    });
  });

  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
};

export const initializeStorage = async (): Promise<void> => {
  try {
    const decks = await getAllDecks();
    if (decks.length === 0) {
      console.log('No existing data found. Seeding test data...');
      await seedTestData();
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

export const getLanguagePreference = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_PREF_KEY);
  } catch (error) {
    console.error('Error loading language preference:', error);
    return null;
  }
};

export const saveLanguagePreference = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_PREF_KEY, language);
  } catch (error) {
    console.error('Error saving language preference:', error);
    throw error;
  }
};

export const getHandwritingLanguage = async (): Promise<string | null> => {
  try {
    const lang = await AsyncStorage.getItem(HANDWRITING_LANG_KEY);
    return lang || 'ko';
  } catch (error) {
    console.error('Error loading handwriting language:', error);
    return 'ko';
  }
};

export const saveHandwritingLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(HANDWRITING_LANG_KEY, language);
  } catch (error) {
    console.error('Error saving handwriting language:', error);
    throw error;
  }
};

export interface ExportedDeck {
  version: string;
  deck: {
    name: string;
    description?: string;
    tags?: string[];
  };
  cards: {
    front: string;
    back: string;
  }[];
  exportedAt: number;
}

export const exportDeckToJSON = async (deckId: string): Promise<string> => {
  try {
    const deck = await getDeckById(deckId);
    const cards = await getCardsByDeck(deckId);

    if (!deck) {
      throw new Error('Deck not found');
    }

    const exportData: ExportedDeck = {
      version: '1.0',
      deck: {
        name: deck.name,
        description: deck.description,
        tags: deck.tags,
      },
      cards: cards.map(card => ({
        front: card.front,
        back: card.back,
      })),
      exportedAt: Date.now(),
    };

    return JSON.stringify(exportData);
  } catch (error) {
    console.error('Error exporting deck:', error);
    throw error;
  }
}

export const importDeckFromJSON = async (jsonString: string): Promise<string> => {
  try {
    const exportData: ExportedDeck = JSON.parse(jsonString);

    if (!exportData.version || !exportData.deck || !exportData.cards) {
      throw new Error('Invalid deck format');
    }

    const now = Date.now();
    const newDeckId = generateId();

    const newDeck: Deck = {
      id: newDeckId,
      name: exportData.deck.name,
      description: exportData.deck.description,
      createdAt: now,
      cardCount: exportData.cards.length,
      tags: exportData.deck.tags || [],
    };

    const newCards: Card[] = exportData.cards.map(cardData => ({
      id: generateId(),
      front: cardData.front,
      back: cardData.back,
      deckId: newDeckId,
      nextReview: now,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: now,
    }));

    await saveDeck(newDeck);

    for (const card of newCards) {
      await saveCard(card);
    }
    
    return newDeckId;
  } catch (error) {
    console.error('Error importing deck:', error);
    throw error;
  }
}

export const getAllTags = async (): Promise<string[]> => {
  try {
    const decks = await getAllDecks();
    const tagSet = new Set<string>();

    decks.forEach(deck => {
      if (deck.tags && deck.tags.length > 0) {
        deck.tags.forEach(tag => tagSet.add(tag));
      }
    });

    return Array.from(tagSet).sort();
  } catch (error) {
    console.error('Error getting all tags:', error);
    return [];
  }
}

export const getDecksByTags = async (tags: string[]): Promise<Deck[]> => {
  try {
    const decks = await getAllDecks();
    return decks.filter(deck => 
      deck.tags && tags.some(tag => deck.tags!.includes(tag))
    );
  } catch (error) {
    console.error('Error getting decks by tags:', error);
    return [];
  }
}
