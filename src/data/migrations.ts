import AsyncStorage from "@react-native-async-storage/async-storage";

// Current schema version
// v1 = SQLite (first release)
export const CURRENT_SCHEMA_VERSION = 1;

const SCHEMA_VERSION_KEY = '@moa_schema_version';

/**
 * Get the current schema version from storage
 */
export const getSchemaVersion = async (): Promise<number> => {
  try {
    const version = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
    return version ? parseInt(version, 10) : 0; // 0 = new install
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
    console.log(`✅ Schema version set to ${version}`);
  } catch (error) {
    console.error('Error setting schema version:', error);
    throw error;
  }
};

/**
 * Initialize database schema for new installations
 * This simply creates the SQLite database with the schema defined in connection.ts
 */
const initializeDatabase = async (): Promise<void> => {
  console.log('🔄 Initializing database...');
  
  try {
    // Dynamic import to avoid circular dependencies
    const { getDatabase } = await import('./db/connection');
    
    // Get database connection (will create schema automatically)
    console.log('📦 Creating SQLite database schema...');
    await getDatabase();
    
    console.log('✅ Database initialized successfully');
    
    // Set schema version
    await setSchemaVersion(CURRENT_SCHEMA_VERSION);
    
    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

/**
 * Run all pending migrations
 * For first release, this just initializes the database
 */
export const runMigrations = async (): Promise<void> => {
  try {
    const currentVersion = await getSchemaVersion();
    
    console.log(`📊 Current schema version: ${currentVersion}`);
    console.log(`📊 Target schema version: ${CURRENT_SCHEMA_VERSION}`);
    
    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      console.log('✅ Database is up to date');
      return;
    }
    
    if (currentVersion === 0) {
      // New installation
      console.log('🚀 New installation detected, initializing database...');
      await initializeDatabase();
    }
    
    // Future migrations will go here:
    // if (currentVersion < 2) {
    //   await migrateV1ToV2();
    // }
    
    console.log('✅ Database ready');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};
