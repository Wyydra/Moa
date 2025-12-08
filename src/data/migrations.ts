import AsyncStorage from "@react-native-async-storage/async-storage";

// Current schema version
// v1 = SQLite (first release)
// v2 = Added back_language column to decks table for separate front/back TTS languages
export const CURRENT_SCHEMA_VERSION = 2;

const SCHEMA_VERSION_KEY = '@moa_schema_version';
const MIGRATION_BACKUP_KEY = '@moa_migration_backup';

/**
 * Type definition for a database migration
 * Each migration must specify version, name, and migration function
 */
type Migration = {
  version: number;
  name: string;
  migrate: () => Promise<void>;
};

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
 * Creates the complete v2 schema directly (no need to migrate from v1)
 */
const initializeDatabase = async (): Promise<void> => {
  console.log('🔄 Initializing database...');
  
  try {
    // Dynamic import to avoid circular dependencies
    const { getDatabase } = await import('./db/connection');
    const { createInitialSchema } = await import('./db/schema');
    
    // Get database connection and create schema
    console.log('📦 Creating SQLite database schema (v2)...');
    const db = await getDatabase();
    await createInitialSchema(db);
    
    console.log('✅ Database initialized successfully');
    
    // Set schema version to current (v2)
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
 * Migrate from v1 to v2: Add back_language column to decks table
 * This migration is idempotent - safe to run multiple times
 */
const migrateV1ToV2 = async (): Promise<void> => {
  try {
    const { getDatabase } = await import('./db/connection');
    const db = await getDatabase();
    
    console.log('  📋 Checking if back_language column exists...');
    
    // Check if column already exists (idempotence)
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(decks)'
    );
    const hasBackLanguage = tableInfo.some(col => col.name === 'back_language');
    
    if (!hasBackLanguage) {
      console.log('  ➕ Adding back_language column to decks table...');
      await db.execAsync(`
        ALTER TABLE decks ADD COLUMN back_language TEXT NOT NULL DEFAULT '';
      `);
      console.log('  ✅ Column added successfully');
    } else {
      console.log('  ℹ️  back_language column already exists, skipping');
    }
    
    console.log('✅ Migration v1 → v2 complete');
  } catch (error) {
    console.error('❌ Migration v1 → v2 failed:', error);
    throw error;
  }
};

/**
 * Central registry of all database migrations
 * Migrations are executed sequentially in order
 * 
 * To add a new migration:
 * 1. Create a migration function (e.g., migrateV2ToV3)
 * 2. Add it to this array with version number and description
 * 3. Update CURRENT_SCHEMA_VERSION above
 */
const MIGRATIONS: Migration[] = [
  {
    version: 2,
    name: 'Add back_language column to decks table',
    migrate: migrateV1ToV2,
  },
  // Future migrations go here in order
  // Example:
  // {
  //   version: 3,
  //   name: 'Add difficulty tracking to cards',
  //   migrate: migrateV2ToV3,
  // },
];

/**
 * Run all pending migrations with backup and recovery
 * Migrations are executed sequentially from current version to target version
 * 
 * Bulletproof guarantees:
 * - Fresh installs go directly to latest version (no migrations)
 * - Existing installs run migrations sequentially with version tracking
 * - Backup created before migration, restored on failure
 * - Idempotent migrations (safe to retry)
 */
export const runMigrations = async (): Promise<void> => {
  try {
    let currentVersion = await getSchemaVersion();
    
    console.log(`📊 Current schema version: ${currentVersion}`);
    console.log(`📊 Target schema version: ${CURRENT_SCHEMA_VERSION}`);
    
    // Fresh installation - create schema directly at latest version
    if (currentVersion === 0) {
      console.log('🚀 New installation detected, initializing database...');
      await initializeDatabase();
      await clearMigrationBackup(); // Clear any orphaned backups
      console.log('✅ Database ready');
      return;
    }
    
    // Already up to date
    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      console.log('✅ Database is up to date');
      await clearMigrationBackup();
      return;
    }
    
    // Migrations needed
    console.log(`🔄 Migrations needed: v${currentVersion} → v${CURRENT_SCHEMA_VERSION}`);
    
    // Create backup before migration
    try {
      await createMigrationBackup();
    } catch (backupError) {
      console.error('⚠️  Backup creation failed:', backupError);
      console.log('⚠️  Continuing migration without backup (risky!)');
      // Continue with warning - user will see this in logs
    }
    
    try {
      // Execute migrations sequentially
      for (const migration of MIGRATIONS) {
        if (currentVersion < migration.version) {
          console.log(`🔄 [v${currentVersion} → v${migration.version}] ${migration.name}...`);
          
          await migration.migrate();
          await setSchemaVersion(migration.version);
          currentVersion = migration.version; // Update local tracking
          
          console.log(`✅ Migration to v${migration.version} complete`);
        }
      }
      
      // Verify we reached target version
      if (currentVersion !== CURRENT_SCHEMA_VERSION) {
        throw new Error(
          `Migration incomplete: reached v${currentVersion} but target is v${CURRENT_SCHEMA_VERSION}. Please report this bug.`
        );
      }
      
      await clearMigrationBackup();
      console.log('✅ All migrations complete - database ready');
      
    } catch (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      
      // Attempt to restore from backup
      console.log('🔄 Attempting to restore from backup...');
      try {
        await restoreFromBackup();
        throw new Error(
          'Migration failed but your data was restored from backup. Please restart the app and report this issue if it persists.'
        );
      } catch (restoreError) {
        console.error('❌ Restore also failed:', restoreError);
        throw new Error(
          'Migration failed AND restore failed. Please backup your data immediately and contact support. Error: ' + (migrationError as Error).message
        );
      }
    }
  } catch (error) {
    console.error('❌ Database migration system failed:', error);
    throw error;
  }
};
