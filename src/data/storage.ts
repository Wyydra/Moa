import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Deck, StudySession } from "./model";
import { RepositoryFactory } from "./db";

// AsyncStorage keys for settings (simple key-value preferences)
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
    const deckRepo = RepositoryFactory.getDeckRepository();
    const existing = await deckRepo.getById(deck.id);

    if (existing) {
      await deckRepo.update(deck);
    } else {
      await deckRepo.create(deck);
    }
  } catch (error) {
    console.error('Error saving deck:', error);
    throw error;
  }
};

export const getAllDecks = async (): Promise<Deck[]> => {
  try {
    const deckRepo = RepositoryFactory.getDeckRepository();
    return await deckRepo.getAll();
  } catch (error) {
    console.error('Error loading decks:', error);
    return [];
  }
}

export const getDeckById = async (deckId: string): Promise<Deck | null> => {
  try {
    const deckRepo = RepositoryFactory.getDeckRepository();
    return await deckRepo.getById(deckId);
  } catch (error) {
    console.error('Error loading deck:', error);
    return null;
  }
};

export const deleteDeck = async (deckId: string): Promise<void> => {
  try {
    const deckRepo = RepositoryFactory.getDeckRepository();
    // CASCADE delete will automatically remove cards
    await deckRepo.delete(deckId);
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
};

export const saveCard = async (card: Card): Promise<void> => {
  try {
    const cardRepo = RepositoryFactory.getCardRepository();
    const deckRepo = RepositoryFactory.getDeckRepository();
    const existing = await cardRepo.getById(card.id);

    if (existing) {
      await cardRepo.update(card);
    } else {
      await cardRepo.create(card);
    }

    // Update deck card count
    await deckRepo.updateCardCounts(card.deckId);
  } catch (error) {
    console.error('Error saving card:', error);
    throw error;
  }
};

export const getAllCards = async (): Promise<Card[]> => {
  try {
    const cardRepo = RepositoryFactory.getCardRepository();
    const deckRepo = RepositoryFactory.getDeckRepository();
    const decks = await deckRepo.getAll();
    
    // Get cards for all decks
    const allCards: Card[] = [];
    for (const deck of decks) {
      const cards = await cardRepo.getByDeck(deck.id);
      allCards.push(...cards);
    }
    
    return allCards;
  } catch (error) {
    console.error('Error loading cards:', error);
    return [];
  }
};

export const getCardsByDeck = async (deckId: string): Promise<Card[]> => {
  try {
    const cardRepo = RepositoryFactory.getCardRepository();
    return await cardRepo.getByDeck(deckId);
  } catch (error) {
    console.error('Error loading cards for deck:', error);
    return [];
  }
};

export const getDueCards = async (deckId: string): Promise<Card[]> => {
  try {
    const cardRepo = RepositoryFactory.getCardRepository();
    return await cardRepo.getDueCards(deckId);
  } catch (error) {
    console.error('Error loading due cards:', error);
    return [];
  }
}

export const getDueCardsByTags = async (tags: string[]): Promise<Card[]> => {
  try {
    const cardRepo = RepositoryFactory.getCardRepository();
    return await cardRepo.getDueCardsByTags(tags);
  } catch (error) {
    console.error('Error loading due cards by tags:', error);
    return [];
  }
}

export const getCardsByTags = async (tags: string[]): Promise<Card[]> => {
  try {
    const cardRepo = RepositoryFactory.getCardRepository();
    return await cardRepo.getCardsByTags(tags);
  } catch (error) {
    console.error('Error loading cards by tags:', error);
    return [];
  }
}

export const deleteCard = async (cardId: string): Promise<void> => {
  try {
    const cardRepo = RepositoryFactory.getCardRepository();
    const deckRepo = RepositoryFactory.getDeckRepository();
    
    // Get card to find deck before deleting
    const card = await cardRepo.getById(cardId);
    await cardRepo.delete(cardId);

    // Update deck card count
    if (card) {
      await deckRepo.updateCardCounts(card.deckId);
    }
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
};

export const moveCardsToAnotherDeck = async (cardIds: string[], targetDeckId: string): Promise<void> => {
  try {
    const cardRepo = RepositoryFactory.getCardRepository();
    const deckRepo = RepositoryFactory.getDeckRepository();
    
    // Get source deck IDs before moving
    const sourceDeckIds = new Set<string>();
    for (const cardId of cardIds) {
      const card = await cardRepo.getById(cardId);
      if (card) {
        sourceDeckIds.add(card.deckId);
      }
    }

    // Move cards
    await cardRepo.moveToAnotherDeck(cardIds, targetDeckId);

    // Update card counts for all affected decks
    await deckRepo.updateCardCounts(targetDeckId);
    for (const sourceDeckId of sourceDeckIds) {
      await deckRepo.updateCardCounts(sourceDeckId);
    }
  } catch (error) {
    console.error('Error moving cards to another deck:', error);
    throw error;
  }
};

const updateDeckCardCount = async (deckId: string): Promise<void> => {
  try {
    const deckRepo = RepositoryFactory.getDeckRepository();
    await deckRepo.updateCardCounts(deckId);
  } catch (error) {
    console.error('Error updating deck card count:', error);
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    const deckRepo = RepositoryFactory.getDeckRepository();
    const decks = await deckRepo.getAll();
    
    // Delete all decks (CASCADE will delete cards and sessions)
    for (const deck of decks) {
      await deckRepo.delete(deck.id);
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

export const seedTestData = async (): Promise<void> => {
  const testDecksData = require('../../test-decks.json');
  const now = Date.now();
  const deckRepo = RepositoryFactory.getDeckRepository();
  const cardRepo = RepositoryFactory.getCardRepository();

  for (let i = 0; i < testDecksData.decks.length; i++) {
    const deckData = testDecksData.decks[i];
    const deckId = generateId();
    
    const deck: Deck = {
      id: deckId,
      name: deckData.name,
      description: deckData.description,
      tags: deckData.tags,
      language: deckData.language,
      createdAt: now + (i * 1000),
      cardCount: deckData.cards.length
    };

    await deckRepo.create(deck);

    for (const cardData of deckData.cards) {
      const card: Card = {
        id: generateId(),
        front: cardData.front,
        back: cardData.back,
        deckId: deckId,
        nextReview: now,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: now
      };
      
      await cardRepo.create(card);
    }
  }
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
    const deckRepo = RepositoryFactory.getDeckRepository();
    return await deckRepo.getAllTags();
  } catch (error) {
    console.error('Error getting all tags:', error);
    return [];
  }
}

export const getDecksByTags = async (tags: string[]): Promise<Deck[]> => {
  try {
    const deckRepo = RepositoryFactory.getDeckRepository();
    return await deckRepo.getByTags(tags);
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
    const sessionRepo = RepositoryFactory.getStudySessionRepository();
    await sessionRepo.create(session);
  } catch (error) {
    console.error('Error saving study session:', error);
    throw error;
  }
};

export const getAllStudySessions = async (): Promise<StudySession[]> => {
  try {
    const sessionRepo = RepositoryFactory.getStudySessionRepository();
    return await sessionRepo.getAll();
  } catch (error) {
    console.error('Error loading study sessions:', error);
    return [];
  }
};

export const getStudyStreak = async (): Promise<number> => {
  try {
    const sessionRepo = RepositoryFactory.getStudySessionRepository();
    return await sessionRepo.getStreak();
  } catch (error) {
    console.error('Error calculating study streak:', error);
    return 0;
  }
};

export const getTodayReviewCount = async (): Promise<number> => {
  try {
    const sessionRepo = RepositoryFactory.getStudySessionRepository();
    return await sessionRepo.getTodayReviewCount();
  } catch (error) {
    console.error('Error counting today reviews:', error);
    return 0;
  }
};

export const getWeekReviewCount = async (): Promise<number> => {
  try {
    const sessionRepo = RepositoryFactory.getStudySessionRepository();
    return await sessionRepo.getWeekReviewCount();
  } catch (error) {
    console.error('Error counting week reviews:', error);
    return 0;
  }
};

export const getOverallAccuracy = async (): Promise<number> => {
  try {
    const sessionRepo = RepositoryFactory.getStudySessionRepository();
    return await sessionRepo.getOverallAccuracy();
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

// Full Data Backup/Restore Functions
export interface FullBackup {
  version: string;
  exportedAt: number;
  decks: Deck[];
  cards: Card[];
  studySessions: StudySession[];
  settings: {
    languagePreference?: string | null;
    handwritingLanguage?: string | null;
    ttsEnabled: boolean;
    ttsAutoPlay: boolean;
    ttsRate: number;
    notificationsEnabled: boolean;
    notificationTime: { hour: number; minute: number };
    streakRemindersEnabled: boolean;
  };
}

export const exportAllData = async (): Promise<string> => {
  try {
    const decks = await getAllDecks();
    const cards = await getAllCards();
    const studySessions = await getAllStudySessions();
    const languagePreference = await getLanguagePreference();
    const handwritingLanguage = await getHandwritingLanguage();
    const ttsEnabled = await getTTSEnabled();
    const ttsAutoPlay = await getTTSAutoPlay();
    const ttsRate = await getTTSRate();
    const notificationsEnabled = await getNotificationsEnabled();
    const notificationTime = await getNotificationTime();
    const streakRemindersEnabled = await getStreakRemindersEnabled();

    const backup: FullBackup = {
      version: '1.0',
      exportedAt: Date.now(),
      decks,
      cards,
      studySessions,
      settings: {
        languagePreference,
        handwritingLanguage,
        ttsEnabled,
        ttsAutoPlay,
        ttsRate,
        notificationsEnabled,
        notificationTime,
        streakRemindersEnabled,
      },
    };

    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Error exporting all data:', error);
    throw error;
  }
};

export const importAllData = async (jsonString: string, overwrite: boolean = false): Promise<void> => {
  try {
    const backup: FullBackup = JSON.parse(jsonString);

    if (!backup.version || !backup.decks || !backup.cards) {
      throw new Error('Invalid backup format');
    }

    const deckRepo = RepositoryFactory.getDeckRepository();
    const cardRepo = RepositoryFactory.getCardRepository();
    const sessionRepo = RepositoryFactory.getStudySessionRepository();

    if (overwrite) {
      // Clear existing data before importing
      await clearAllData();
    }

    // Import decks
    for (const deck of backup.decks) {
      if (overwrite) {
        await deckRepo.create(deck);
      } else {
        const existing = await deckRepo.getById(deck.id);
        if (!existing) {
          await deckRepo.create(deck);
        }
      }
    }

    // Import cards
    for (const card of backup.cards) {
      if (overwrite) {
        await cardRepo.create(card);
      } else {
        const existing = await cardRepo.getById(card.id);
        if (!existing) {
          await cardRepo.create(card);
        }
      }
    }

    // Import study sessions
    if (backup.studySessions) {
      for (const session of backup.studySessions) {
        // Always append study sessions (no duplicates check needed)
        await sessionRepo.create(session);
      }
    }

    // Import settings
    if (backup.settings) {
      if (backup.settings.languagePreference) {
        await saveLanguagePreference(backup.settings.languagePreference);
      }
      if (backup.settings.handwritingLanguage) {
        await saveHandwritingLanguage(backup.settings.handwritingLanguage);
      }
      await setTTSEnabled(backup.settings.ttsEnabled);
      await setTTSAutoPlay(backup.settings.ttsAutoPlay);
      await setTTSRate(backup.settings.ttsRate);
      await setNotificationsEnabled(backup.settings.notificationsEnabled);
      await setNotificationTime(backup.settings.notificationTime.hour, backup.settings.notificationTime.minute);
      await setStreakRemindersEnabled(backup.settings.streakRemindersEnabled);
    }
  } catch (error) {
    console.error('Error importing all data:', error);
    throw error;
  }
};

export const getStorageSize = async (): Promise<number> => {
  try {
    const { getDatabaseSize } = await import('./db');
    
    // Get SQLite database size
    const dbSize = await getDatabaseSize();
    
    // Get AsyncStorage settings size (settings are stored in AsyncStorage)
    const keys = [
      LANGUAGE_PREF_KEY,
      HANDWRITING_LANG_KEY,
      TTS_ENABLED_KEY,
      TTS_AUTO_PLAY_KEY,
      TTS_RATE_KEY,
      NOTIFICATIONS_ENABLED_KEY,
      NOTIFICATIONS_TIME_KEY,
      NOTIFICATIONS_STREAK_KEY,
    ];

    let settingsSize = 0;
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        // Calculate size in bytes (rough estimate)
        settingsSize += new Blob([value]).size;
      }
    }

    return dbSize + settingsSize;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
};
