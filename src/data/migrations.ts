import AsyncStorage from "@react-native-async-storage/async-storage";

// Current schema version
// v1 = SQLite (first release)
export const CURRENT_SCHEMA_VERSION = 1;

const SCHEMA_VERSION_KEY = '@moa_schema_version';
const MIGRATION_BACKUP_KEY = '@moa_migration_backup';

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
 * Create a backup of current data before migration
 */
const createMigrationBackup = async (): Promise<void> => {
  try {
    console.log('💾 Creating migration backup...');
    
    // Dynamic import to avoid circular dependencies
    const { exportAllData } = await import('./storage');
    const backupData = await exportAllData();
    
    // Store backup with timestamp
    const backupWithMetadata = JSON.stringify({
      data: backupData,
      timestamp: Date.now(),
      version: await getSchemaVersion(),
    });
    
    await AsyncStorage.setItem(MIGRATION_BACKUP_KEY, backupWithMetadata);
    console.log('✅ Migration backup created');
  } catch (error) {
    console.error('⚠️ Warning: Failed to create migration backup:', error);
    // Don't throw - backup failure shouldn't block migration
  }
};

/**
 * Restore from migration backup if migration fails
 */
const restoreFromBackup = async (): Promise<void> => {
  try {
    console.log('🔄 Attempting to restore from backup...');
    
    const backupJson = await AsyncStorage.getItem(MIGRATION_BACKUP_KEY);
    if (!backupJson) {
      console.log('⚠️ No backup found to restore');
      return;
    }
    
    const backup = JSON.parse(backupJson);
    const { data, version } = backup;
    
    // Dynamic import to avoid circular dependencies
    const { importAllData } = await import('./storage');
    await importAllData(data, true);
    
    // Restore schema version
    await setSchemaVersion(version);
    
    console.log('✅ Data restored from backup');
  } catch (error) {
    console.error('❌ Failed to restore from backup:', error);
    throw new Error('Migration failed and backup restoration also failed. Please contact support.');
  }
};

/**
 * Clear migration backup after successful migration
 */
const clearMigrationBackup = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MIGRATION_BACKUP_KEY);
    console.log('🗑️ Migration backup cleared');
  } catch (error) {
    console.error('⚠️ Warning: Failed to clear migration backup:', error);
    // Don't throw - cleanup failure is not critical
  }
};

/**
 * Run all pending migrations with backup and recovery
 * For first release, this just initializes the database
 */
export const runMigrations = async (): Promise<void> => {
  try {
    const currentVersion = await getSchemaVersion();
    
    console.log(`📊 Current schema version: ${currentVersion}`);
    console.log(`📊 Target schema version: ${CURRENT_SCHEMA_VERSION}`);
    
    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      console.log('✅ Database is up to date');
      // Clear any old backups
      await clearMigrationBackup();
      return;
    }
    
    // Create backup before migration (skip for new installations)
    if (currentVersion > 0) {
      await createMigrationBackup();
    }
    
    try {
      if (currentVersion === 0) {
        // New installation
        console.log('🚀 New installation detected, initializing database...');
        await initializeDatabase();
      }
      
      // Future migrations will go here:
      // if (currentVersion < 2) {
      //   await migrateV1ToV2();
      // }
      
      // Clear backup after successful migration
      await clearMigrationBackup();
      
      console.log('✅ Database ready');
    } catch (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      
      // Attempt to restore from backup
      if (currentVersion > 0) {
        console.log('🔄 Attempting recovery...');
        await restoreFromBackup();
        throw new Error('Migration failed but data was restored from backup. Please restart the app.');
      }
      
      throw migrationError;
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};
