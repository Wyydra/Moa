import AsyncStorage from "@react-native-async-storage/async-storage";

// Current schema version
export const CURRENT_SCHEMA_VERSION = 1;

const SCHEMA_VERSION_KEY = '@moa_schema_version';
const DECKS_KEY = '@moa_decks';
const CARDS_KEY = '@moa_cards';
const STUDY_SESSIONS_KEY = '@moa_study_sessions';

/**
 * Get the current schema version from storage
 */
export const getSchemaVersion = async (): Promise<number> => {
  try {
    const version = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
    return version ? parseInt(version, 10) : 0; // 0 = new install or pre-migration
  } catch (error) {
    console.error('Error getting schema version:', error);
    return 0;
  }
};

/**
 * Set the schema version in storage
 */
const setSchemaVersion = async (version: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, version.toString());
    console.log(`✅ Schema upgraded to version ${version}`);
  } catch (error) {
    console.error('Error setting schema version:', error);
    throw error;
  }
};

/**
 * Migration from v0 (initial) to v1
 * This handles the initial setup for existing users
 */
const migrateV0ToV1 = async (): Promise<void> => {
  console.log('🔄 Running migration v0 → v1...');
  
  try {
    // Check if user has existing data (decks or cards)
    const decksData = await AsyncStorage.getItem(DECKS_KEY);
    const cardsData = await AsyncStorage.getItem(CARDS_KEY);
    
    if (decksData || cardsData) {
      // User has existing data, just add schema version
      console.log('Found existing data, preserving it');
    } else {
      // New user, no data to migrate
      console.log('New installation, no data to migrate');
    }
    
    // Mark as v1
    await setSchemaVersion(1);
  } catch (error) {
    console.error('❌ Migration v0 → v1 failed:', error);
    throw error;
  }
};

/**
 * Example: Migration from v1 to v2 (for future use)
 * Uncomment and modify when you need to add new fields
 */
/*
const migrateV1ToV2 = async (): Promise<void> => {
  console.log('🔄 Running migration v1 → v2...');
  
  try {
    // Example: Add a new optional field to all decks
    const decksData = await AsyncStorage.getItem(DECKS_KEY);
    if (decksData) {
      const decks: Deck[] = JSON.parse(decksData);
      
      // Add new field with default value
      const updatedDecks = decks.map(deck => ({
        ...deck,
        // newField: defaultValue, // Add your new field here
      }));
      
      await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(updatedDecks));
      console.log(`✅ Migrated ${updatedDecks.length} decks`);
    }
    
    // Example: Add new field to cards
    const cardsData = await AsyncStorage.getItem(CARDS_KEY);
    if (cardsData) {
      const cards: Card[] = JSON.parse(cardsData);
      
      const updatedCards = cards.map(card => ({
        ...card,
        // newField: defaultValue, // Add your new field here
      }));
      
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));
      console.log(`✅ Migrated ${updatedCards.length} cards`);
    }
    
    await setSchemaVersion(2);
  } catch (error) {
    console.error('❌ Migration v1 → v2 failed:', error);
    throw error;
  }
};
*/

/**
 * Run all pending migrations
 */
export const runMigrations = async (): Promise<void> => {
  try {
    const currentVersion = await getSchemaVersion();
    
    console.log(`📊 Current schema version: ${currentVersion}`);
    console.log(`📊 Target schema version: ${CURRENT_SCHEMA_VERSION}`);
    
    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      console.log('✅ Schema is up to date, no migrations needed');
      return;
    }
    
    console.log(`🚀 Starting migrations from v${currentVersion} to v${CURRENT_SCHEMA_VERSION}...`);
    
    // Run migrations in order
    if (currentVersion < 1) {
      await migrateV0ToV1();
    }
    
    // Add future migrations here:
    // if (currentVersion < 2) {
    //   await migrateV1ToV2();
    // }
    // if (currentVersion < 3) {
    //   await migrateV2ToV3();
    // }
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    // Don't throw - let app continue with existing data
    // Log the error but don't crash the app
  }
};

/**
 * Backup all data (for debugging or manual recovery)
 */
export const backupAllData = async (): Promise<string> => {
  try {
    const decks = await AsyncStorage.getItem(DECKS_KEY);
    const cards = await AsyncStorage.getItem(CARDS_KEY);
    const sessions = await AsyncStorage.getItem(STUDY_SESSIONS_KEY);
    const schemaVersion = await getSchemaVersion();
    
    const backup = {
      version: schemaVersion,
      timestamp: Date.now(),
      data: {
        decks: decks ? JSON.parse(decks) : [],
        cards: cards ? JSON.parse(cards) : [],
        sessions: sessions ? JSON.parse(sessions) : [],
      }
    };
    
    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * Restore data from backup (for debugging)
 */
export const restoreFromBackup = async (backupJson: string): Promise<void> => {
  try {
    const backup = JSON.parse(backupJson);
    
    if (backup.data.decks) {
      await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(backup.data.decks));
    }
    if (backup.data.cards) {
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(backup.data.cards));
    }
    if (backup.data.sessions) {
      await AsyncStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(backup.data.sessions));
    }
    
    console.log('✅ Data restored from backup');
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
};
