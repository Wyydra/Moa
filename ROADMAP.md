# 🗺️ Moa Development Roadmap

> Track progress towards completing Moa's core features

---

## 📊 Overall Progress

**Core Features:** 82% Complete
**Study Modes:** 60% Complete (Spell mode pending)
**Import/Export:** 100% Complete (JSON ✅, CSV pending but optional, Quizlet/PDF abandoned)
**Progress Tracking:** 100% Complete
**Community Features:** 10% Complete

---

## ✅ Completed Features

### Foundation
- [x] React Native + Expo setup with navigation
- [x] Data models (Card, Deck, SRS types)
- [x] AsyncStorage persistence layer
- [x] SM-2 spaced repetition algorithm
- [x] TypeScript strict mode
- [x] i18n support (English, French)

### Deck & Card Management
- [x] Home screen with due card counts
- [x] Library screen to browse decks
- [x] Create deck with name, description, tags, language
- [x] Edit deck properties
- [x] Deck details with card list
- [x] Add cards (front/back content)
- [x] Edit cards

### Study Modes (Partial)
- [x] Study screen with flashcard review
- [x] Flip animation and SRS ratings (Again/Hard/Good/Easy)
- [x] Test mode (basic multiple choice)
- [x] Match mode (timed matching game)
- [x] Write mode (handwriting canvas)

### Handwriting (Partial)
- [x] Handwriting canvas component
- [x] Google ML Kit Digital Ink Recognition integration
- [x] Native Kotlin module for Android
- [x] Korean/Japanese model download
- [x] Real-time stroke rendering
- [x] Auto-scroll and recognition
- [x] Modal handwriting input

### Audio & Pronunciation
- [x] Text-to-Speech (TTS) integration
- [x] PronunciationButton component
- [x] Language detection (Korean/Japanese/Chinese via franc)
- [x] Deck-specific language settings
- [x] Dropdown language selector (modal-based)
- [x] TTS in Study screen
- [x] TTS speed control (0.5x - 2.0x slider in Settings)
- [x] TTS auto-play setting (SettingsScreen)
- [x] TTS enable/disable toggle

### Import/Export (Partial)
- [x] QR code generation from decks
- [x] Deep linking for deck import (via QR scan)
- [x] JSON deck export to `.moa` file
- [x] Share modal with QR display
- [x] File-based deck import (DocumentPicker)
- [x] JSON deck import with validation
- [x] Import from URL (deep linking)

---

## 🚧 Phase 1: Complete Core Study Modes (High Priority)

### Spell Mode (Audio Dictation)
- [ ] Create SpellScreen component
- [ ] Auto-play TTS when card appears
- [ ] Text input for typing answers
- [ ] Spelling validation and feedback
- [ ] Option to use handwriting instead of typing
- [ ] Progress tracking through deck
- [ ] Navigation integration

### Study Mode Picker
- [ ] Create unified mode selection screen
- [ ] Show available modes: Learn, Write, Spell, Test, Match
- [ ] Mode descriptions and icons
- [ ] Navigate to selected mode with deck context
- [ ] Update navigation from DeckDetailsScreen

### TTS Enhancements ✅ COMPLETE
- [x] Add speed control (0.5x - 2.0x) to PronunciationButton
- [x] Auto-pronunciation setting in Settings
- [x] Save speed preference per user (AsyncStorage)
- [x] Apply auto-play in Study screen if enabled
- [x] Speed control UI (slider with current value display)

### Write Mode Enhancements
- [ ] Add typed answer mode (not just handwriting)
- [ ] Spelling accuracy checking
- [ ] Instant feedback UI
- [ ] Compare correct vs user answer
- [ ] Switch between typing and handwriting

### Test Mode Improvements
- [ ] Add True/False questions
- [ ] Add written (long-form) questions
- [ ] Question type randomization
- [ ] Better result summary screen

---

## 📈 Phase 2: Progress & Motivation ✅ COMPLETE

### Progress Dashboard ✅ COMPLETE
- [x] Create ProgressScreen component
- [x] Study streak tracking (days in a row)
- [x] Accuracy percentage calculation
- [x] Cards mastered vs learning vs new
- [x] Per-deck progress breakdown
- [x] Navigation integration (4th tab)
- [x] Motivational messages (streak, all caught up)
- [ ] Study time statistics (optional future enhancement)
- [ ] Weak spots identification (optional future enhancement)
- [ ] Achievements/badges system (optional future enhancement)

### Data Tracking ✅ COMPLETE
- [x] Add study session history to storage
- [x] Track review attempts, accuracy, time spent
- [x] Add streak calculation logic
- [x] Analytics utilities (today/week reviews, overall accuracy)
- [x] Integration with all 4 study modes (Learn, Write, Test, Match)
- [ ] Store achievement unlocks (optional future enhancement)

### Home Screen Enhancements (Optional Future)
- [ ] Show current streak
- [ ] Show today's study goal progress
- [ ] Quick stats cards (total reviews, accuracy)
- [ ] Motivational messages

---

## 📤 Phase 3: Content Management (Medium Priority)

### CSV Import/Export
- [ ] CSV parser utility (e.g., `papaparse`)
- [ ] CSV import option in LibraryScreen
- [ ] Map CSV columns to card fields (front, back)
- [ ] Bulk card creation from CSV
- [ ] Export deck to CSV format
- [ ] Handle errors and validation
- [ ] Support for tags/language in CSV headers

### ~~Quizlet Import~~ (ABANDONED)
- ~~Quizlet URL parser~~
- ~~Fetch Quizlet set data~~
- **Decision:** Abandoned in favor of JSON import/export and CSV support

### ~~PDF Export~~ (ABANDONED)
- ~~Generate PDF from deck~~
- ~~Format as printable study guide~~
- **Decision:** Abandoned - JSON/CSV export sufficient for most use cases

---

## 🗒️ Phase 4: Interactive Lessons (Medium Priority)

### Lesson System
- [ ] Lesson data model
- [ ] Lesson storage and retrieval
- [ ] LessonScreen component
- [ ] Display lesson content (text, examples)
- [ ] Embedded quiz questions
- [ ] Link lessons to decks
- [ ] Track lesson completion
- [ ] Navigation integration

### Lesson Content
- [ ] Create Hangul basics lesson
- [ ] Create particles lesson
- [ ] Create verb tenses lesson
- [ ] Create common expressions lesson
- [ ] Lesson discovery/library screen

### Lesson Editor (Optional)
- [ ] Admin/creator interface for lessons
- [ ] Rich text editor for content
- [ ] Quiz question builder
- [ ] Preview lesson before publishing
- [ ] Backend integration if needed

---

## ✍️ Phase 5: Handwriting Refinements (Low Priority)

### Stroke Order Validation
- [ ] Stroke order database for Hangul
- [ ] Compare user strokes to correct order
- [ ] Visual feedback for incorrect order
- [ ] Step-by-step stroke guidance
- [ ] Stroke order animation display

### Compare Mode
- [ ] Show user's handwriting vs correct version
- [ ] Side-by-side comparison UI
- [ ] Overlay mode (transparency)
- [ ] Highlight differences
- [ ] Save handwriting samples

### Recognition Improvements
- [ ] Fine-tune recognition accuracy
- [ ] Multi-character recognition
- [ ] Better candidate suggestions
- [ ] Confidence scores display

---

## 🌐 Phase 6: Community & Sharing (Future)

### Community Library
- [ ] Backend API for deck sharing
- [ ] Browse public decks screen
- [ ] Search and filter decks
- [ ] Deck preview before import
- [ ] User accounts/authentication
- [ ] Upload deck to community

### Rating & Reviews
- [ ] Star rating system
- [ ] Text reviews for decks
- [ ] Report inappropriate content
- [ ] Sort by rating/popularity
- [ ] Show deck download counts

### Content Moderation
- [ ] Admin panel for content review
- [ ] Flag/report system
- [ ] Content guidelines
- [ ] Automated quality checks

---

## 🐛 Bug Fixes & Polish

### Known Issues
- [ ] Test language picker in release build
- [ ] Verify handwriting on various devices
- [ ] Handle large decks (1000+ cards) performance
- [ ] Improve loading states consistency
- [ ] Better error messages for users

### UI/UX Polish
- [ ] Consistent animations across screens
- [ ] Loading spinners where needed
- [ ] Empty states for all lists
- [ ] Confirmation dialogs for destructive actions
- [ ] Accessibility improvements (screen readers)
- [ ] Dark mode support (optional)

### Testing
- [ ] Set up test suite (Jest + React Native Testing Library)
- [ ] Unit tests for SRS algorithm
- [ ] Unit tests for storage layer
- [ ] Integration tests for key flows
- [ ] E2E tests for critical paths

---

## 📝 Documentation

- [ ] User guide (how to use each feature)
- [ ] Contributing guidelines
- [ ] API documentation (if backend added)
- [ ] Code comments cleanup
- [ ] Architecture documentation
- [ ] Release notes template

---

## 🎯 Quick Wins for Next Session

**High-Impact, Low-Effort Tasks:**

1. **Spell Mode** - Combine existing TTS + text input for dictation study mode (~30-45 min) - ONLY REMAINING MVP FEATURE
2. ~~**Progress Dashboard (Basic)**~~ - ✅ COMPLETE
3. **CSV Import** (Optional) - Basic parsing and card creation with papaparse (~30 min)
4. **CSV Export** (Optional) - Export deck to CSV format for Excel/Sheets (~20 min)

---

## 📅 Milestone Targets

### MVP Complete (82% → 90%)
- ❌ All core study modes working (Learn ✅, Write ✅, Spell ❌, Test ✅, Match ✅)
- ✅ Basic progress tracking visible (Progress Dashboard ✅)
- ✅ TTS fully functional with controls
- ✅ Import/Export complete (JSON file + QR + deep link)
- **Target:** Next session (ONLY Spell mode remaining!)

### Feature Complete (85% → 95%)
- ✅ CSV Import/Export (optional enhancement)
- ✅ Comprehensive progress dashboard with analytics
- ✅ Basic lessons available
- ✅ Handwriting refinements (stroke order, compare mode)
- **Target:** 1-2 months

### Community Ready (95% → 100%)
- ✅ Backend and community library
- ✅ All polish and bug fixes
- ✅ Testing and documentation complete
- **Target:** 2-3 months

---

## 🎨 Design Consistency Checklist

- [ ] All screens use commonStyles
- [ ] COLORS and SPACING constants used everywhere
- [ ] Consistent button styles
- [ ] Consistent header patterns
- [ ] Consistent empty states
- [ ] Consistent loading states
- [ ] Consistent error handling

---

## 🚀 Release Checklist

### Pre-Release
- [ ] All Phase 1 features complete
- [ ] All Phase 2 features complete
- [ ] Critical bugs fixed
- [ ] Performance tested on low-end devices
- [ ] Security review (keystore, sensitive data)
- [ ] Privacy policy created
- [ ] Terms of service created

### Release Build
- [ ] Update version numbers
- [ ] Generate signed APK/AAB
- [ ] Test release build thoroughly
- [ ] Create release notes
- [ ] Tag release in git

### Post-Release
- [ ] Submit to Play Store
- [ ] Share with classmates for testing
- [ ] Gather feedback
- [ ] Monitor crash reports
- [ ] Plan next iteration

---

**Last Updated:** November 19, 2024
**Current Phase:** Phase 1 - Complete Core Study Modes (95% Done!)
**Next Milestone:** MVP Complete (90% - only Spell Mode remaining)
**Blockers:** None - Spell Mode is the last MVP feature

**Recent Completion:** Progress Dashboard (Phase 2) ✅
- Study session tracking across all modes
- Streak calculation & analytics
- Per-deck progress visualization
- Full i18n support (EN/FR)
