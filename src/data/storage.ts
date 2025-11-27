import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Deck, StudySession } from "./model";

const DECKS_KEY = '@moa_decks';
const CARDS_KEY = '@moa_cards';
const STUDY_SESSIONS_KEY = '@moa_study_sessions';
const LANGUAGE_PREF_KEY = '@moa_language_preference';
const HANDWRITING_LANG_KEY = '@moa_handwriting_language';
const TTS_ENABLED_KEY = '@moa_tts_enabled';
const TTS_AUTO_PLAY_KEY = '@moa_tts_auto_play';
const TTS_RATE_KEY = '@moa_tts_rate';
const NOTIFICATIONS_ENABLED_KEY = '@moa_notifications_enabled';
const NOTIFICATIONS_TIME_KEY = '@moa_notifications_time';
const NOTIFICATIONS_STREAK_KEY = '@moa_notifications_streak';

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
    const decks: Deck[] = data ? JSON.parse(data) : [];
    // Filter out soft-deleted decks
    return decks.filter(d => !d.deleted);
  } catch (error) {
    console.error('Error loading decks:', error);
    return [];
  }
}

export const getAllDecksIncludingDeleted = async (): Promise<Deck[]> => {
  try {
    const data = await AsyncStorage.getItem(DECKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading decks including deleted:', error);
    return [];
  }
};

export const getDeckById = async (deckId: string): Promise<Deck | null> => {
  try {
    const decks = await getAllDecks();
    // getAllDecks already filters deleted items
    return decks.find(d => d.id === deckId) || null;
  } catch (error) {
    console.error('Error loading deck:', error);
    return null;
  }
};

export const deleteDeck = async (deckId: string): Promise<void> => {
  try {
    const data = await AsyncStorage.getItem(DECKS_KEY);
    const decks: Deck[] = data ? JSON.parse(data) : [];
    
    // Soft delete: mark deck as deleted
    const updatedDecks = decks.map(d => 
      d.id === deckId 
        ? { ...d, deleted: true, deletedAt: Date.now() }
        : d
    );
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(updatedDecks));

    // Cascade soft delete to cards
    const cardsData = await AsyncStorage.getItem(CARDS_KEY);
    const cards: Card[] = cardsData ? JSON.parse(cardsData) : [];
    const updatedCards = cards.map(c =>
      c.deckId === deckId
        ? { ...c, deleted: true, deletedAt: Date.now() }
        : c
    );
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));
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
    const cards: Card[] = data ? JSON.parse(data) : [];
    // Filter out soft-deleted cards
    return cards.filter(c => !c.deleted);
  } catch (error) {
    console.error('Error loading cards:', error);
    return [];
  }
};

export const getAllCardsIncludingDeleted = async (): Promise<Card[]> => {
  try {
    const data = await AsyncStorage.getItem(CARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading cards including deleted:', error);
    return [];
  }
};

export const getCardsByDeck = async (deckId: string): Promise<Card[]> => {
  try {
    const cards = await getAllCards();
    // getAllCards already filters deleted items
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
    const data = await AsyncStorage.getItem(CARDS_KEY);
    const cards: Card[] = data ? JSON.parse(data) : [];
    
    const card = cards.find(c => c.id === cardId);
    
    // Soft delete: mark card as deleted
    const updatedCards = cards.map(c =>
      c.id === cardId
        ? { ...c, deleted: true, deletedAt: Date.now() }
        : c
    );
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));

    if (card) {
      await updateDeckCardCount(card.deckId);
    }
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
};

export const moveCardsToAnotherDeck = async (cardIds: string[], targetDeckId: string): Promise<void> => {
  try {
    const cards = await getAllCards();
    const sourceDeckIds = new Set<string>();

    // Update deckId for all selected cards
    const updatedCards = cards.map(card => {
      if (cardIds.includes(card.id)) {
        sourceDeckIds.add(card.deckId);
        return { ...card, deckId: targetDeckId };
      }
      return card;
    });

    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));

    // Update card counts for both source and target decks
    await updateDeckCardCount(targetDeckId);
    for (const sourceDeckId of sourceDeckIds) {
      await updateDeckCardCount(sourceDeckId);
    }
  } catch (error) {
    console.error('Error moving cards to another deck:', error);
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
      language: deckData.language,
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
      console.log('No existing data found. Starting with empty library.');
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
    language?: string;
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
        language: deck.language,
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
      language: exportData.deck.language,
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

export const getTTSEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(TTS_ENABLED_KEY);
    return value === null ? true : value === 'true';
  } catch (error) {
    console.error('Error loading TTS enabled:', error);
    return true;
  }
};

export const setTTSEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(TTS_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('Error saving TTS enabled:', error);
    throw error;
  }
};
export const getTTSAutoPlay = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(TTS_AUTO_PLAY_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error loading TTS auto-play:', error);
    return false;
  }
};
export const setTTSAutoPlay = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(TTS_AUTO_PLAY_KEY, enabled.toString());
  } catch (error) {
    console.error('Error saving TTS auto-play:', error);
    throw error;
  }
};
export const getTTSRate = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(TTS_RATE_KEY);
    return value ? parseFloat(value) : 1.0;
  } catch (error) {
    console.error('Error loading TTS rate:', error);
    return 1.0;
  }
};
export const setTTSRate = async (rate: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(TTS_RATE_KEY, rate.toString());
  } catch (error) {
    console.error('Error saving TTS rate:', error);
    throw error;
  }
};

// Study Session Functions
export const saveStudySession = async (session: StudySession): Promise<void> => {
  try {
    const sessions = await getAllStudySessions();
    sessions.push(session);
    await AsyncStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving study session:', error);
    throw error;
  }
};

export const getAllStudySessions = async (): Promise<StudySession[]> => {
  try {
    const data = await AsyncStorage.getItem(STUDY_SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading study sessions:', error);
    return [];
  }
};

export const getStudyStreak = async (): Promise<number> => {
  try {
    const sessions = await getAllStudySessions();
    
    if (sessions.length === 0) {
      return 0;
    }

    // Group sessions by day
    const daySet = new Set<string>();
    sessions.forEach(session => {
      const date = new Date(session.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      daySet.add(dayKey);
    });

    const sortedDays = Array.from(daySet).sort().reverse();
    
    if (sortedDays.length === 0) {
      return 0;
    }

    // Check if today has activity
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Start from today or yesterday depending on whether today has activity
    if (sortedDays[0] !== todayKey) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Count consecutive days backwards
    while (true) {
      const checkKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
      
      if (daySet.has(checkKey)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating study streak:', error);
    return 0;
  }
};

export const getTodayReviewCount = async (): Promise<number> => {
  try {
    const sessions = await getAllStudySessions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return sessions.filter(session => session.timestamp >= todayTimestamp).length;
  } catch (error) {
    console.error('Error counting today reviews:', error);
    return 0;
  }
};

export const getWeekReviewCount = async (): Promise<number> => {
  try {
    const sessions = await getAllStudySessions();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekAgoTimestamp = weekAgo.getTime();

    return sessions.filter(session => session.timestamp >= weekAgoTimestamp).length;
  } catch (error) {
    console.error('Error counting week reviews:', error);
    return 0;
  }
};

export const getOverallAccuracy = async (): Promise<number> => {
  try {
    const sessions = await getAllStudySessions();
    
    if (sessions.length === 0) {
      return 0;
    }

    // For flashcard-style responses, consider 'good' and 'easy' as correct
    const correctCount = sessions.filter(session => 
      session.correct || session.response === 'good' || session.response === 'easy'
    ).length;

    return Math.round((correctCount / sessions.length) * 100);
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    return 0;
  }
};

// Notification Settings Functions
export const getNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return value === null ? true : value === 'true';
  } catch (error) {
    console.error('Error loading notifications enabled:', error);
    return true;
  }
};

export const setNotificationsEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('Error saving notifications enabled:', error);
    throw error;
  }
};

export const getNotificationTime = async (): Promise<{ hour: number; minute: number }> => {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_TIME_KEY);
    if (value) {
      return JSON.parse(value);
    }
    return { hour: 20, minute: 0 }; // Default: 8 PM
  } catch (error) {
    console.error('Error loading notification time:', error);
    return { hour: 20, minute: 0 };
  }
};

export const setNotificationTime = async (hour: number, minute: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATIONS_TIME_KEY,
      JSON.stringify({ hour, minute })
    );
  } catch (error) {
    console.error('Error saving notification time:', error);
    throw error;
  }
};

export const getStreakRemindersEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_STREAK_KEY);
    return value === null ? true : value === 'true';
  } catch (error) {
    console.error('Error loading streak reminders enabled:', error);
    return true;
  }
};

export const setStreakRemindersEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_STREAK_KEY, enabled.toString());
  } catch (error) {
    console.error('Error saving streak reminders enabled:', error);
    throw error;
  }
};

// Cleanup function to permanently delete items soft-deleted more than 30 days ago
export const cleanupOldDeleted = async (): Promise<void> => {
  try {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    // Cleanup decks
    const decksData = await AsyncStorage.getItem(DECKS_KEY);
    if (decksData) {
      const decks: Deck[] = JSON.parse(decksData);
      const filteredDecks = decks.filter(d => 
        !d.deleted || (d.deletedAt && d.deletedAt > thirtyDaysAgo)
      );
      await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(filteredDecks));
    }

    // Cleanup cards
    const cardsData = await AsyncStorage.getItem(CARDS_KEY);
    if (cardsData) {
      const cards: Card[] = JSON.parse(cardsData);
      const filteredCards = cards.filter(c =>
        !c.deleted || (c.deletedAt && c.deletedAt > thirtyDaysAgo)
      );
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filteredCards));
    }
  } catch (error) {
    console.error('Error cleaning up old deleted items:', error);
  }
};
