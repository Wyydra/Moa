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
- **Navigation**: React Navigation v7 with bottom tabs + native stack. Navigate via `navigation.navigate()`.
- **SRS**: Spaced repetition in `src/utils/srsAlgorithm.ts` - use `calculateNextReview()` for card scheduling.
