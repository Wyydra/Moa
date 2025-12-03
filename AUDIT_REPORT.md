# Moa Application Code Audit Report
**Date**: November 28, 2025  
**Auditor**: OpenCode Agent  
**Scope**: Full codebase analysis - React Native/Expo flashcard application

---

## Executive Summary

This audit examined the Moa flashcard application, a React Native/Expo-based spaced repetition learning tool with handwriting recognition, stroke order validation, and multi-language support. The application is generally well-structured with proper TypeScript configuration and good architectural patterns. However, several areas require attention for production readiness.

**Overall Assessment**: 🟡 Good Foundation, Needs Improvements

---

## 1. Critical Issues

### 1.1 Missing Test Infrastructure ⚠️ HIGH PRIORITY
**Location**: Root directory  
**Issue**: No test suite configured despite TypeScript strict mode.

**Impact**:
- No automated testing for SRS algorithm correctness
- No validation of storage operations (data integrity risk)
- No component testing for user flows
- Regression risk with future changes

**Recommendation**:
```bash
# Add test dependencies
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native

# Priority test targets:
# 1. src/utils/srsAlgorithm.ts - critical business logic
# 2. src/data/storage.ts - data persistence layer
# 3. src/utils/strokeOrder/validator.ts - handwriting validation
# 4. Core user flows (study sessions, card creation)
```

### 1.2 Unused Backend Code ✅ RESOLVED
**Location**: `backend/` directory  
**Issue**: Entire Go backend exists but is not used by the application.

**Status**: **COMPLETED** - Backend directory has been removed from the codebase.

### 1.3 AsyncStorage Limitations ✅ RESOLVED
**Location**: `src/data/storage.ts`  
**Issue**: AsyncStorage has 6MB limit on Android.

**Status**: **COMPLETED** - Storage monitoring implemented:
- ✅ `getStorageSize()` function added to monitor AsyncStorage usage
- ✅ Returns total bytes used across all storage keys

**Still TODO**:
- Add cleanup for old study session history (retention policy)
- Add user-facing storage usage UI in Settings

**Recommendation for future enhancement**:
```typescript
// Add cleanup for old study sessions
export async function cleanupOldSessions(retentionDays: number = 365) {
  const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const decks = await getAllDecks();
  
  decks.forEach(deck => {
    deck.cards = deck.cards.map(card => ({
      ...card,
      history: card.history?.filter(h => h.timestamp > cutoff) || []
    }));
  });
  
  await saveAllDecks(decks);
}
```

---

## 2. Performance Issues

### 2.1 Unoptimized List Rendering 🟡 MEDIUM
**Location**: Multiple screen files  
**Issue**: FlatList components may not be using optimal configurations.

**Files to Check**:
- `src/screens/LibraryScreen.tsx`
- `src/screens/BrowseScreen.tsx`
- `src/screens/DeckDetailsScreen.tsx`

**Recommendation**:
```typescript
// Ensure all FlatList components have:
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}  // Add this
  maxToRenderPerBatch={10}      // Add this
  windowSize={10}               // Add this
  initialNumToRender={10}       // Add this
/>
```

### 2.2 Storage Operations Not Batched 🟡 MEDIUM
**Location**: `src/data/storage.ts:72-84`  
**Issue**: Individual AsyncStorage calls for card updates.

**Current Code**:
```typescript
export async function updateCard(deckId: string, card: Card): Promise<void> {
  const decks = await getAllDecks();
  // ... updates single card ...
  await saveAllDecks(decks);
}
```

**Problem**: Study session with 20 cards = 20 full deck saves.

**Recommendation**:
```typescript
// Add batch update function
export async function batchUpdateCards(
  updates: Array<{ deckId: string; card: Card }>
): Promise<void> {
  const decks = await getAllDecks();
  
  updates.forEach(({ deckId, card }) => {
    const deck = decks.find(d => d.id === deckId);
    if (deck) {
      const index = deck.cards.findIndex(c => c.id === card.id);
      if (index !== -1) deck.cards[index] = card;
    }
  });
  
  await saveAllDecks(decks);
}
```

### 2.3 HandwritingCanvas Re-renders 🟡 LOW
**Location**: `src/components/HandwritingCanvas.tsx`  
**Issue**: Potential unnecessary re-renders during drawing.

**Recommendation**:
- Add `React.memo()` if not present
- Use `useCallback` for drawing handlers
- Verify canvas is not re-creating on every stroke

---

## 3. Architecture Concerns

### 3.1 Data Model Duplication 🟡 MEDIUM
**Location**: `src/data/model.ts` vs `backend/internal/models/`

**Issue**: Two sources of truth for data models.

**Mismatch Examples**:
- Backend has `User` model, app doesn't
- Backend uses SQL relations, app uses nested objects
- Field names may differ

**Recommendation**:
1. **Decision needed**: Local-only or backend-synced app?
2. If local-only: Remove backend entirely
3. If backend planned: Add sync strategy document

### 3.2 No Data Versioning Strategy 🟡 MEDIUM
**Location**: `src/data/migrations.ts`

**Current State**: Migration system exists but may be incomplete.

**Missing**:
- Version checking on app start
- Migration failure recovery
- Rollback mechanism
- Migration testing

**Recommendation**:
```typescript
// Add to storage.ts
const STORAGE_VERSION_KEY = 'storage_version';
const CURRENT_VERSION = 2;

export async function initializeStorage(): Promise<void> {
  const version = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
  const currentVersion = version ? parseInt(version) : 0;
  
  if (currentVersion < CURRENT_VERSION) {
    try {
      await runMigrations(currentVersion, CURRENT_VERSION);
      await AsyncStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION.toString());
    } catch (error) {
      console.error('Migration failed:', error);
      // Handle migration failure - maybe backup data
    }
  }
}
```

### 3.3 Stroke Order Database Size 🟡 MEDIUM
**Location**: `src/utils/strokeOrder/database.ts`

**Concern**: If stroke data is bundled, app size could be large.

**Recommendation**:
- Check current app bundle size
- Consider lazy loading stroke data
- Use on-demand download for uncommon characters

---

## 4. Code Quality Issues

### 4.1 Error Handling Inconsistency 🟡 GOOD - NEEDS I18N
**Locations**: Various files

**Investigation Status**: **COMPLETED** - Pattern analysis finished

**Issues Found**:
1. ~~Some functions throw errors, others return undefined~~ ✅ **PATTERN IS CONSISTENT**
2. ⚠️ User-facing errors not internationalized (see below)
3. ~~No error boundary for React components~~ ✅ **COMPLETED**

**Completed**:
- ✅ Created `ErrorBoundary` component at `src/components/ErrorBoundary.tsx`
- ✅ Wrapped main `App.tsx` with `ErrorBoundary` for crash protection
- ✅ Added dev-mode error details display
- ✅ **Pattern analysis completed** (consistent try-catch throughout codebase)

**Investigation Findings**:
- ✅ **storage.ts** (818 lines): Consistent error handling pattern
  - All async functions use try-catch blocks
  - Critical operations (save, delete) throw errors to caller
  - Read operations return safe defaults ([], null, default values)
  - All errors logged with `console.error()`
- ✅ **srsAlgorithm.ts** (61 lines): No error handling needed (pure calculation)
- ✅ **strokeOrder/validator.ts** (343 lines): Returns ValidationResult objects (no throwing)
- ✅ **deepLinking.ts** (282 lines): Comprehensive validation with detailed error messages

**Remaining Issue - Internationalization**:
⚠️ **Found hardcoded Korean message** in `src/utils/strokeOrder/validator.ts:206`:
```typescript
'완벽해요! Perfect stroke order! 🎉'  // Should use i18n
```

**Still TODO**:
- Internationalize hardcoded success/error messages in stroke order validation
- Consider adding structured error types instead of generic strings

### 4.2 Magic Numbers ✅ RESOLVED
**Location**: Various files

**Status**: **COMPLETED** - Time calculation constants extracted (commit 2b512fb):

**Investigation Results**:
- Searched codebase for hardcoded numeric calculations
- Found 4 instances of time calculations that needed extraction:
  - `src/utils/srsAlgorithm.ts` (lines 17, 51) - `24 * 60` and `24 * 60 * 60 * 1000`
  - `src/data/storage.ts` (lines 767, 805) - `retentionDays * 24 * 60 * 60 * 1000`
- Other constants already properly defined (POSITION_TOLERANCE, size limits, etc.)

**Implementation**:
```typescript
// Added to src/utils/constants.ts
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MINUTES_PER_DAY: 24 * 60,
  HOURS_PER_DAY: 24,
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 60 * 60,
  SECONDS_PER_DAY: 24 * 60 * 60,
};
```

**Updated Files**:
- ✅ `src/utils/constants.ts` - Added TIME_CONSTANTS export
- ✅ `src/utils/srsAlgorithm.ts` - Replaced hardcoded time calculations
- ✅ `src/data/storage.ts` - Replaced hardcoded time calculations
- ✅ TypeScript compilation verified - no errors

### 4.3 TypeScript Type Safety ✅ RESOLVED
**Issue**: TypeScript hints and deprecated API usage.

**Status**: **COMPLETED** - All TypeScript issues resolved:
- ✅ Fixed unused imports in `src/data/migrations.ts`
- ✅ Fixed unused imports in `src/screens/StudyScreen.tsx`
- ✅ Fixed unused imports in `src/screens/ProgressScreen.tsx`
- ✅ Fixed deprecated `Notifications.Subscription` in `App.tsx` (changed to `EventSubscription`)
- ✅ TypeScript compilation clean (no errors)

---

## 5. Security Findings

### 5.1 Security Configuration ✅ GOOD
**Location**: `.gitignore`, security setup

**Findings**:
- ✅ Keystore files properly excluded
- ✅ `.env` in .gitignore
- ✅ No credentials in code

**Note**: Per AGENTS.md, security practices are followed.

### 5.2 Deep Linking Validation ✅ RESOLVED
**Location**: `src/utils/deepLinking.ts`

**Status**: **COMPLETED** - Comprehensive validation implemented in commit `bedf69a`:

**Implemented Security Measures**:
- ✅ Size limits: 1MB max for deck data, 100K chars max for URLs (DoS prevention)
- ✅ Input validation: Type checking for all parameters
- ✅ URL format validation: Ensures `moa://import-deck?data=` prefix
- ✅ Base64 character validation: Only allows valid URL-safe base64 characters
- ✅ Deck structure validation: Validates version, deck object, and cards array
- ✅ Field validation: Checks all required fields (name, front, back) are non-empty strings
- ✅ Content limits: Deck name max 100 chars, card fields max 5000 chars each
- ✅ Card count limits: Min 1 card, max 10,000 cards per deck
- ✅ Detailed error messages: Provides actionable feedback to users
- ✅ JSDoc comments: All public functions documented

**Functions Added**:
- `validateDeckJSON()`: Comprehensive deck structure validation
- Enhanced `encodeDeckToUrl()`: Pre-encode validation and size checks
- Enhanced `decodeDeckFromURL()`: Multi-layer security validation
- Enhanced `handleImportURL()`: Validated parsing and error handling

---

## 6. UX & Feature Gaps

### 6.1 No Loading States ✅ RESOLVED
**Issue**: AsyncStorage operations may show no feedback.

**Status**: **COMPLETED** - Loading states implemented:
- ✅ Created `LoadingSpinner` component at `src/components/LoadingSpinner.tsx`
- ✅ Added loading states to `HomeScreen.tsx`
- ✅ Added loading states to `StudyScreen.tsx`
- ✅ Added loading states to `ProgressScreen.tsx`
- ✅ Supports both inline and full-screen loading with optional text

### 6.2 No Data Export/Backup ✅ RESOLVED
**Issue**: Users cannot backup their progress.

**Status**: **COMPLETED** - Full backup/restore implemented:
- ✅ `exportAllData()` function exports all decks and settings to JSON
- ✅ `importAllData()` function restores data with version checking
- ✅ Supports both merge and overwrite modes for imports
- ✅ Includes export date and version metadata
- ✅ UI integrated in Settings screen for backup/restore operations

**Implementation Details**:
```typescript
// Implemented in storage.ts
export async function exportAllData(): Promise<string> {
  // Exports decks, settings, and metadata
}

export async function importAllData(jsonString: string, overwrite: boolean): Promise<void> {
  // Validates version and imports data with merge/overwrite options
}
```

### 6.3 No Offline Error Handling ✅ NOT APPLICABLE
**Issue**: If app uses network features (pronunciation, images), no offline handling.

**Status**: **NOT APPLICABLE** - App is fully offline-capable

**Investigation Findings**:
- ✅ **No network dependencies found**: Searched codebase for fetch, axios, XMLHttpRequest - none found
- ✅ **No network detection library**: `@react-native-community/netinfo` not in package.json
- ✅ **TTS is offline**: Uses `expo-speech` (device-native speech synthesis)
  - Works offline on both iOS and Android
  - No API calls or internet required
  - Found in: PronunciationButton, StudyScreen, MatchScreen, TestScreen, WriteScreen, BrowseScreen
- ✅ **No external images**: All images bundled with app
- ✅ **All data stored locally**: SQLite + AsyncStorage only

**Conclusion**: The app is completely offline-capable by design. No network error handling needed.

### 6.4 Accessibility 🟡 MEDIUM
**Issue**: Accessibility support not evident in code.

**Recommendation**:
```typescript
// Add to all interactive components
<TouchableOpacity
  accessible={true}
  accessibilityLabel={t('deck.open')}
  accessibilityRole="button"
  accessibilityHint={t('deck.openHint')}
>
```

---

## 7. Testing Recommendations

### 7.1 Priority Test Suites

**1. SRS Algorithm Tests** (CRITICAL)
```typescript
// __tests__/utils/srsAlgorithm.test.ts
describe('calculateNextReview', () => {
  it('should return 1 day for first correct answer', () => {
    // Test business logic
  });
  
  it('should reset interval on incorrect answer', () => {
    // Test failure handling
  });
});
```

**2. Storage Tests** (CRITICAL)
```typescript
// __tests__/data/storage.test.ts
describe('storage operations', () => {
  it('should handle concurrent card updates', () => {
    // Test race conditions
  });
  
  it('should recover from corrupted data', () => {
    // Test error recovery
  });
});
```

**3. Component Tests** (HIGH)
- HandwritingCanvas input handling
- Navigation flows
- Study session completion

**4. Integration Tests** (MEDIUM)
- Complete study session flow
- Deck import/export
- Migration scenarios

---

## 8. Documentation Gaps

### 8.1 Missing Documentation
- **API docs**: No JSDoc comments on public functions
- **Architecture**: No system design document
- **Setup guide**: Limited onboarding for contributors
- **Stroke order data**: How is it generated/updated?

### 8.2 Recommendations

**Add JSDoc to all public functions**:
```typescript
/**
 * Calculates the next review timestamp for a flashcard using SM-2 algorithm.
 * 
 * @param card - The card to schedule
 * @param quality - User response quality (0-5)
 * @returns Timestamp in milliseconds for next review
 * 
 * @example
 * const nextReview = calculateNextReview(card, 4);
 * card.nextReview = nextReview;
 */
export function calculateNextReview(card: Card, quality: number): number {
  // ...
}
```

**Create ARCHITECTURE.md**:
- Data flow diagram
- Storage architecture
- Navigation structure
- Handwriting recognition pipeline

---

## 9. Summary & Action Plan

### Immediate Actions (Next Sprint)
1. ✅ **Remove or document backend** - Backend removed in previous commits
2. ✅ **Add storage size monitoring** - `getStorageSize()` implemented in storage.ts
3. ✅ **Implement data export** - `exportAllData()`/`importAllData()` implemented
4. ❌ **Add test infrastructure** - **STILL NEEDED** - Jest + React Native Testing Library

### Short Term (1-2 Months)
5. ❌ **Write critical tests** - **STILL NEEDED** - Requires #4 first
6. ✅ **Add loading states** - LoadingSpinner component implemented
7. ✅ **Validate deep linking** - Comprehensive security hardening completed (commit bedf69a)
8. ✅ **Code quality audit** - Magic numbers extracted (commit 2b512fb), error handling verified
9. ❌ **Performance audit** - **STILL NEEDED** - FlatList optimization pending
10. ❌ **Add accessibility** - **STILL NEEDED** - accessibilityLabel/Role props needed

### Long Term (3-6 Months)
10. 🟡 **Migration strategy** - Basic migrations.ts exists, needs versioning strategy
11. ✅ **Error boundaries** - ErrorBoundary component implemented
12. ❌ **Architecture docs** - **STILL NEEDED** - ARCHITECTURE.md should be created
13. 🟡 **Consider backend sync** - Backend removed, decision made for local-only
14. ❌ **Optimize bundle size** - **STILL NEEDED** - Stroke order lazy loading pending

---

## Appendix A: Code Quality Metrics

**TypeScript Compliance**: ✅ Strict mode enabled  
**Test Coverage**: ❌ 0% (no tests)  
**Security**: ✅ Keystore properly excluded  
**Documentation**: 🟡 Partial (AGENTS.md, README.md exist)  
**Performance**: 🟡 Good architecture, needs optimization  
**Accessibility**: ❌ Not implemented  

---

## Appendix B: File-Specific Findings

### Critical Files Reviewed
- ✅ `src/data/storage.ts` - Core persistence layer
- ✅ `src/utils/srsAlgorithm.ts` - Business logic
- ✅ `App.tsx` - Initialization & navigation
- ✅ `src/utils/strokeOrder/validator.ts` - Handwriting feature
- ✅ `src/i18n/config.ts` - Internationalization

### Files Needing Attention
- 🟡 `backend/` - Entire directory unused
- 🟡 All screen files - Add error boundaries
- 🟡 `src/data/migrations.ts` - Expand migration logic
- 🟡 All components - Add accessibility props

---

**End of Audit Report**

For questions or clarifications, refer to the specific file locations and line numbers cited throughout this document.
