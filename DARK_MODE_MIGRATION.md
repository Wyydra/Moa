# Dark Mode Migration Guide

## ✅ Completed Infrastructure (Phase 1)

1. ✅ **Theme System** (`src/utils/themes.ts`) - lightTheme & darkTheme palettes
2. ✅ **ThemeContext** (`src/contexts/ThemeContext.tsx`) - Provider with state management
3. ✅ **useTheme Hook** (`src/hooks/useTheme.ts`) - Hook to access theme
4. ✅ **Storage Functions** (`src/data/storage.ts`) - getThemeMode() & setThemeMode()
5. ✅ **App.tsx** - Wrapped with ThemeProvider, dynamic StatusBar
6. ✅ **commonStyles.ts** - Converted to createCommonStyles(theme) function
7. ✅ **i18n Translations** - EN & FR translations added for theme settings

## 📋 Migration Pattern for Screens/Components

### Step 1: Update Imports

```typescript
// OLD:
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../utils/constants';

// NEW:
import { createCommonStyles } from '../styles/commonStyles';
import { useTheme } from '../hooks/useTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
```

### Step 2: Add useTheme Hook in Component

```typescript
// At the top of your component function:
export default function MyScreen({ navigation }: any) {
  const { theme } = useTheme();
  const commonStyles = createCommonStyles(theme);
  
  // ... rest of component
}
```

### Step 3: Convert StyleSheet to Function

```typescript
// OLD:
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  text: {
    color: COLORS.text,
  },
});

// NEW:
const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.background,
  },
  text: {
    color: theme.text,
  },
});

// Then in component:
export default function MyScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const commonStyles = createCommonStyles(theme);
  
  // ... rest
}
```

### Step 4: Replace All COLORS.x with theme.x

Search and replace pattern:
- `COLORS.primary` → `theme.primary`
- `COLORS.text` → `theme.text`
- `COLORS.surface` → `theme.surface`
- etc.

**Note**: SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS remain unchanged (not theme-specific).

### Step 5: Fix Hardcoded Colors

Replace:
- `'rgba(0, 0, 0, 0.6)'` → `theme.overlay`
- `'#FF3B30'` → `theme.danger`
- `'white'` → `theme.textInverse` or `theme.surface`
- `'#000'` in shadows → keep as is (shadows are universal)

## 🔧 Files Requiring Migration

### High Priority (App Functional)
- [ ] `src/screens/HomeScreen.tsx`
- [ ] `src/screens/LibraryScreen.tsx`
- [ ] `src/screens/DeckDetailsScreen.tsx`
- [ ] `src/screens/SettingsScreen.tsx` (**Special**: Add theme picker UI)
- [ ] `src/screens/ProgressScreen.tsx`

### Medium Priority (Study Modes)
- [ ] `src/screens/StudyScreen.tsx`
- [ ] `src/screens/TestScreen.tsx`
- [ ] `src/screens/WriteScreen.tsx`
- [ ] `src/screens/MatchScreen.tsx`
- [ ] `src/screens/BrowseScreen.tsx`

### Medium Priority (CRUD Screens)
- [ ] `src/screens/AddCardScreen.tsx`
- [ ] `src/screens/EditCardScreen.tsx`
- [ ] `src/screens/CreateDeckScreen.tsx`
- [ ] `src/screens/EditDeckScreen.tsx`

### Components
- [ ] `src/components/LanguagePicker.tsx`
- [ ] `src/components/OptionPicker.tsx`
- [ ] `src/components/MarkdownEditor.tsx`
- [ ] `src/components/LoadingSpinner.tsx`
- [ ] `src/components/PronunciationButton.tsx`
- [ ] `src/components/handwriting/HandwritingModule.tsx`
- [ ] `src/components/handwriting/HandwritingCanvas.tsx` (partially done)

## 🎨 Special Case: SettingsScreen Theme Picker

Add this section in SettingsScreen after App Language:

```typescript
// In imports:
import { ThemeMode } from '../contexts/ThemeContext';

// In component:
const { themeMode, setThemeMode } = useTheme();

// State:
const [currentThemeMode, setCurrentThemeMode] = useState<ThemeMode>(themeMode);

useEffect(() => {
  setCurrentThemeMode(themeMode);
}, [themeMode]);

const handleThemeChange = async (mode: string) => {
  await setThemeMode(mode as ThemeMode);
  setCurrentThemeMode(mode as ThemeMode);
};

// In JSX (after App Language section):
<Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>

<OptionPicker
  label={t('settings.theme')}
  description={t('settings.themeDescription')}
  value={currentThemeMode}
  options={[
    { code: 'auto', name: t('settings.themeAuto'), icon: '🌓' },
    { code: 'light', name: t('settings.themeLight'), icon: '☀️' },
    { code: 'dark', name: t('settings.themeDark'), icon: '🌙' },
  ]}
  onValueChange={handleThemeChange}
/>
```

## 🚀 Quick Migration Script

For any screen file, follow this checklist:

1. **Imports**:
   ```typescript
   import { useTheme } from '../hooks/useTheme';
   import { createCommonStyles } from '../styles/commonStyles';
   import type { Theme } from '../utils/themes';
   ```

2. **In Component**:
   ```typescript
   const { theme } = useTheme();
   const commonStyles = createCommonStyles(theme);
   const styles = createStyles(theme);
   ```

3. **Move StyleSheet to Function**:
   ```typescript
   const createStyles = (theme: Theme) => StyleSheet.create({ /* ... */ });
   ```

4. **Find/Replace**: `COLORS.` → `theme.`

5. **Test**: Check screen renders in both light and dark mode

## 📝 Testing Checklist

After migration, test each screen:
- [ ] Renders correctly in light mode
- [ ] Renders correctly in dark mode
- [ ] Text is readable on all backgrounds
- [ ] Borders are visible
- [ ] Buttons have proper contrast
- [ ] Modals have proper overlay
- [ ] No hardcoded colors remain

## 🎯 Current Status

**Infrastructure**: ✅ 100% Complete
**High Priority Screens**: ⏳ 0% Complete (needs manual migration)
**Medium Priority**: ⏳ 0% Complete
**Components**: ⏳ 0% Complete

## 💡 Tips

- Start with one screen at a time
- Test immediately after each migration
- Use Android device/emulator to toggle system dark mode to verify
- Check Settings → Display → Dark theme on Android to toggle
- The StatusBar will automatically update to match theme

## ⚠️ Known Issues to Fix

1. **LibraryScreen.tsx:346** - Hardcoded `#FF3B30` → use `theme.danger`
2. **CreateDeckScreen.tsx:118,208** - Hardcoded `'white'` → use `theme.textInverse`
3. **Modal overlays** - Replace `rgba(0,0,0,0.6)` with `theme.overlay`

## 📚 Reference

- **Light Theme**: Zinc-50 to Zinc-900 palette  
- **Dark Theme**: Zinc-950 to Zinc-50 (inverted)
- **Primary Colors**: Automatically lighter in dark mode for contrast
- **Semantic Colors**: Slightly more vibrant in dark mode

Good luck with migration! 🚀
