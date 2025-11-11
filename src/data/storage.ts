import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Deck } from "./model";

const DECKS_KEY = '@moa_decks';
const CARDS_KEY = '@moa_cards';

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
