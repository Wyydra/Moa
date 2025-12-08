# Agent Guidelines for Moa

## Security
- **NEVER read or access** `android/keystore.properties` or `*.keystore` files - they contain sensitive credentials
- **NEVER commit** keystore files or credentials to git

## Build Commands
- **Dev server**: `npm start` or `just dev`
- **Android debug**: `npx expo run:android` or `just android`
- **Android release**: `npx expo run:android --variant release` or `just android-release`
- **Build AAB**: `cd android && ./gradlew bundleRelease` (for Play Store)
- **iOS**: `npx expo run:ios` or `just ios`
- **No tests configured** - test suite needs to be added

## Code Style
- **TypeScript**: Strict mode enabled. Always use explicit types for function parameters and return values.
- **Components**: Functional components with hooks. Default export for screens/components, named exports for utilities.
- **Imports**: Group by external deps, React/RN, local modules. Use absolute paths from `src/`.
- **Styling**: Use `StyleSheet.create` inline with components. Import `COLORS` and `SPACING` from `src/utils/constants`.
- **Error Handling**: Use try-catch blocks with `console.error()` for logging. Throw errors for storage/critical operations.
- **Async**: Use async/await, not promises. Handle errors in UI with Alert or user feedback.
- **Naming**: camelCase for variables/functions, PascalCase for components/types, UPPER_SNAKE_CASE for constants.
- **State**: Use useState/useEffect hooks. For navigation refresh, use `useFocusEffect` with cleanup.
- **i18n**: Use `useTranslation()` hook and `t('key')` for all user-facing strings.

## Architecture
- **Storage**: All persistence via AsyncStorage in `src/data/storage.ts`. Use provided functions (getAllDecks, saveCard, etc).
- **Database**: SQLite for structured data. Schema in `src/data/db/schema.ts`, migrations in `src/data/migrations.ts`.
- **Navigation**: React Navigation v7 with bottom tabs + native stack. Navigate via `navigation.navigate()`.
- **SRS**: Spaced repetition in `src/utils/srsAlgorithm.ts` - use `calculateNextReview()` for card scheduling.

## Database Migrations

### Current Schema Version: 2
- **v1**: Initial SQLite schema (decks, cards, study_sessions)
- **v2**: Added `back_language` column to decks table for separate front/back TTS languages

### How to Add a New Migration

When you need to modify the database schema (add column, table, index, etc.), follow this bulletproof process:

#### Step 1: Create the Migration Function

Add a new migration function in `src/data/migrations.ts`:

```typescript
/**
 * Migrate from v2 to v3: [Brief description of what this migration does]
 * This migration is idempotent - safe to run multiple times
 */
const migrateV2ToV3 = async (): Promise<void> => {
  try {
    const { getDatabase } = await import('./db/connection');
    const db = await getDatabase();
    
    console.log('  📋 [Description of what we're checking]...');
    
    // ALWAYS check if change already exists (idempotence is critical!)
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(table_name)'
    );
    const hasColumn = tableInfo.some(col => col.name === 'new_column');
    
    if (!hasColumn) {
      console.log('  ➕ [Description of what we're adding]...');
      await db.execAsync(`
        ALTER TABLE table_name ADD COLUMN new_column TEXT DEFAULT '';
      `);
      console.log('  ✅ Change applied successfully');
    } else {
      console.log('  ℹ️  Change already exists, skipping');
    }
    
    console.log('✅ Migration v2 → v3 complete');
  } catch (error) {
    console.error('❌ Migration v2 → v3 failed:', error);
    throw error;
  }
};
```

#### Step 2: Register in MIGRATIONS Array

Add your migration to the `MIGRATIONS` array (keep in sequential order):

```typescript
const MIGRATIONS: Migration[] = [
  {
    version: 2,
    name: 'Add back_language column to decks table',
    migrate: migrateV1ToV2,
  },
  {
    version: 3,
    name: '[Brief description for logs]',
    migrate: migrateV2ToV3,
  },
];
```

#### Step 3: Update CURRENT_SCHEMA_VERSION

```typescript
export const CURRENT_SCHEMA_VERSION = 3;
```

#### Step 4: Update schema.ts for Fresh Installs

**IMPORTANT**: Fresh installs skip migrations and use `schema.ts` directly. Update `src/data/db/schema.ts` to include your change in the `createInitialSchema()` function:

```typescript
CREATE TABLE IF NOT EXISTS table_name (
  ...existing columns...
  new_column TEXT DEFAULT '',  -- v3: your change description
  ...
);
```

This ensures fresh installs and migrated installs have identical schemas.

#### Step 5: Test Both Scenarios

1. **Test migration** (existing user):
   - Use developer tools to force schema version to previous version
   - Reload app, verify migration runs successfully
   - Check logs for: `🔄 [v2 → v3] ...`

2. **Test fresh install** (new user):
   - Uninstall app completely
   - Reinstall, verify schema v3 created directly
   - Check logs for: `🚀 New installation detected`

### Migration Best Practices

- ✅ **Always idempotent**: Check if change exists before applying
- ✅ **Sequential order**: Migrations run v1→v2→v3→... never skip
- ✅ **Descriptive logs**: Use console.log for each step (helps debugging)
- ✅ **Clear error messages**: Throw with context if migration fails
- ✅ **Sync schema.ts**: Fresh installs must match migrated installs
- ✅ **Test rollback**: System auto-restores from backup on failure
- ❌ **Never destructive**: Don't DROP columns/tables (data loss)
- ❌ **Never assume order**: Don't depend on migration X running before Y

### Troubleshooting

**"Duplicate column" error**: Migration isn't idempotent. Add existence check.

**"Migration incomplete" error**: `CURRENT_SCHEMA_VERSION` doesn't match highest migration version.

**Fresh installs differ from migrations**: `schema.ts` not updated to match migrations.

**Backup failed warning**: Storage full or permissions issue. Migration continues with warning.

### Migration System Guarantees

- 🛡️ **Bulletproof**: Sequential execution, no version skipping
- 🔄 **Idempotent**: Safe to retry failed migrations
- 💾 **Backup**: Auto-backup before migration, auto-restore on failure
- 📊 **Tracking**: Version persisted in AsyncStorage after each step
- 🚀 **Optimized**: Fresh installs skip all migrations
