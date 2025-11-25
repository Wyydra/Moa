# 🪶 Moa

> *Learn Korean, one word at a time.*

**Moa** (모아) means *"to gather"* in Korean — collecting words, knowledge, and small daily moments of progress.

A minimalist Korean learning app built with React Native, featuring spaced repetition flashcards, multiple study modes, handwriting recognition, and TTS pronunciation.

---

## 📱 Current Status

**v1.0 Release Candidate** - 92% Complete and ready for production!

- ✅ 5 study modes fully implemented
- ✅ Complete progress tracking system
- ✅ TTS with auto-language detection
- ✅ Handwriting recognition (Google ML Kit)
- ✅ Import/export via JSON and QR codes
- ✅ Bilingual UI (English/French)

**Awaiting:** Google Play Store validation

---

## ✨ Features

### 🎮 Multiple Study Modes

**Learn Mode** - SRS flashcard review
- Flip cards to reveal answers
- Rate your recall: Again / Hard / Good / Easy
- Smart scheduling adapts to your memory
- Progress tracked per card

**Write Mode** - Handwriting practice
- Draw Korean characters with your finger/stylus
- Google ML Kit recognition for instant feedback
- Supports Korean and Japanese
- Modal handwriting canvas (keyboard-style)

**Test Mode** - Auto-generated quizzes
- Multiple choice questions from your deck
- Randomized answer options
- Instant feedback and scoring
- Session summary with accuracy percentage

**Match Mode** - Timed matching game
- Match terms with definitions
- Racing against the clock
- Visual feedback with animations
- Score tracking and completion time

**Browse Mode** - Free navigation
- Flip through cards without SRS ratings
- Simple Next/Previous navigation
- Perfect for quick review or casual browsing

**All modes support:**
- 🔄 Reverse cards toggle (swap front/back)
- 🔊 TTS pronunciation buttons
- 🏷️ Tag-based filtering
- 🔀 Card shuffling

### 🎧 Text-to-Speech System

- **Auto-language detection** - Identifies Korean, Japanese, Chinese, English, French, Spanish, German, Arabic
- **Two-stage detection** - Unicode ranges for CJK languages + franc library for longer text
- **Speed control** - Adjust playback from 0.5x to 2.0x
- **Auto-play option** - Automatic pronunciation when cards appear
- **Per-tile TTS** - In Match mode, each tile can be pronounced independently
- **Consolidated utility** - Single source of truth for language detection (src/utils/languageDetection.ts)

### ✍️ Handwriting Recognition

- **Google ML Kit integration** - On-device Digital Ink Recognition
- **Native Android module** - Custom Kotlin implementation (HandwritingModule.kt)
- **Infinite scrollable canvas** - Auto-scroll on inactivity
- **Real-time rendering** - Dark background with smooth strokes
- **Model management** - Download and initialize Korean/Japanese models
- **Modal input** - Keyboard-style handwriting canvas

### 📊 Progress Tracking

- **Study streaks** - Track consecutive days of study
- **Accuracy statistics** - Overall and per-deck performance
- **Cards mastered** - See your progress (new / learning / mastered)
- **Session history** - Review attempts, accuracy, and time spent
- **Motivational messages** - Encouragement for streaks and completion

### 📤 Import & Export

- **JSON export** - Save decks to `.moa` files
- **JSON import** - Import decks from files or URLs
- **QR code generation** - Share decks via QR codes
- **QR code scanning** - Import decks by scanning
- **Deep linking** - `moa://` URL scheme for deck import
- **Validation** - Comprehensive import validation with error handling

### 🗂️ Deck Management

- Create and edit decks with name, description, tags
- Add and edit cards (front/back content)
- Deck-specific language settings
- Tag-based organization
- Card list view with quick actions
- Duplicate deck protection

### 🌍 Internationalization

- **English** - Full UI translation
- **French** - Complete bilingual support
- **Language switcher** - In Settings screen
- **react-i18next integration** - All user-facing strings localized

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native + Expo |
| **Language** | TypeScript (strict mode) |
| **Navigation** | React Navigation v7 (bottom tabs + native stack) |
| **Storage** | AsyncStorage (local persistence) |
| **SRS Algorithm** | SM-2 (spaced repetition) |
| **TTS** | expo-speech |
| **Handwriting** | Google ML Kit Digital Ink Recognition |
| **Native Module** | Kotlin (Android) |
| **QR Codes** | react-native-qrcode-svg |
| **Deep Linking** | expo-linking |
| **i18n** | react-i18next |
| **Language Detection** | franc (+ Unicode range detection) |

---

## 📂 Project Structure

```
moa/
├── android/           # Android native code
│   └── app/src/main/java/dev/wydry/moa/
│       ├── HandwritingModule.kt    # ML Kit integration
│       └── MainActivity.kt
├── ios/               # iOS native code (future)
├── backend/           # Go backend API (in development)
│   ├── cmd/api/       # API server
│   └── internal/      # Backend models
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── HandwritingCanvas.tsx
│   │   ├── PronunciationButton.tsx
│   │   ├── OptionPicker.tsx
│   │   ├── StrokeAnimation.tsx
│   │   └── StrokeOrderFeedback.tsx
│   ├── data/          # Data layer
│   │   ├── model.ts   # TypeScript types (Card, Deck, etc.)
│   │   └── storage.ts # AsyncStorage persistence functions
│   ├── i18n/          # Internationalization
│   │   ├── config.ts
│   │   └── locales/   # EN/FR translations
│   ├── screens/       # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── DeckDetailsScreen.tsx
│   │   ├── StudyScreen.tsx        # Learn mode
│   │   ├── WriteScreen.tsx        # Handwriting mode
│   │   ├── TestScreen.tsx         # Quiz mode
│   │   ├── MatchScreen.tsx        # Matching game
│   │   ├── BrowseScreen.tsx       # Free navigation mode
│   │   ├── ProgressScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── CreateDeckScreen.tsx
│   │   ├── EditDeckScreen.tsx
│   │   ├── AddCardScreen.tsx
│   │   └── EditCardScreen.tsx
│   ├── styles/        # Shared styles
│   │   └── commonStyles.ts
│   └── utils/         # Utilities
│       ├── constants.ts           # COLORS, SPACING
│       ├── deepLinking.ts         # Deck import/export
│       ├── languageDetection.ts   # TTS language detection
│       ├── notifications.ts
│       ├── srsAlgorithm.ts        # SM-2 implementation
│       └── strokeOrder/           # Handwriting validation (future)
├── App.tsx            # Root component with navigation
├── app.json           # Expo config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/moa.git
cd moa

# Install dependencies
npm install

# Start development server
npm start
# or
npx expo start
```

### Running on Devices

**Android:**
```bash
# Development build
npx expo run:android

# Release build
npx expo run:android --variant release
```

**iOS:**
```bash
npx expo run:ios
```

### Build Commands

See [AGENTS.md](./AGENTS.md) for detailed build instructions and code style guidelines.

**Quick reference:**
- Dev server: `npm start` or `just dev`
- Android debug: `just android`
- Android release: `just android-release`
- Build AAB (Play Store): `cd android && ./gradlew bundleRelease`

---

## 📸 Screenshots

> **Note:** Screenshots will be added once the app is released on the Play Store.

### Study Modes
- [ ] Home screen with deck overview
- [ ] Learn mode (flashcard review)
- [ ] Write mode (handwriting canvas)
- [ ] Test mode (multiple choice quiz)
- [ ] Match mode (matching game)
- [ ] Browse mode (free navigation)

### Features
- [ ] Progress dashboard with streaks
- [ ] Deck details with card list
- [ ] Settings screen
- [ ] QR code sharing
- [ ] TTS pronunciation controls

---

## 🎯 Roadmap

See [ROADMAP.md](./ROADMAP.md) for the complete development roadmap.

### v1.0 (Current - 92% Complete)
- ✅ 5 study modes (Learn, Write, Test, Match, Browse)
- ✅ Progress tracking with streaks
- ✅ TTS with auto-language detection
- ✅ Handwriting recognition
- ✅ Import/export (JSON + QR)
- ⏳ Google Play Store release (awaiting validation)

### v1.1 (Planned)
- Spell mode (audio dictation with voice recognition)
- CSV import/export
- Study mode picker UI
- Test mode enhancements (T/F, written questions)

### v2.0 (Future)
- Interactive lessons system
- Backend API and community library
- Stroke order validation
- Content rating and discovery

---

## 🌸 Design Philosophy

Moa is built for learners who want to grow their Korean quietly and consistently.

**Core principles:**
- **Small steps every day** - "한 걸음씩 (one step at a time)"
- **Minimal visual noise** - Clean typography, calm colors
- **Encouraging progress** - Not perfection
- **Personal tool first** - Created to help me review Korean, then shared with classmates

> *"Gather words, grow fluency. One Moa at a time."*

---

## 🧑‍💻 Development

### Code Style

- **TypeScript strict mode** - Explicit types for function parameters and return values
- **Functional components** - React hooks (useState, useEffect, useFocusEffect)
- **Default exports** - For screens/components
- **Named exports** - For utilities
- **StyleSheet.create** - Inline with components
- **Import constants** - COLORS and SPACING from src/utils/constants
- **Error handling** - try-catch with console.error, throw for critical operations
- **Async/await** - No raw promises
- **Naming conventions:**
  - camelCase for variables/functions
  - PascalCase for components/types
  - UPPER_SNAKE_CASE for constants

### Testing

⚠️ **Test suite needs to be added**

Planned:
- Unit tests for SRS algorithm
- Unit tests for storage layer
- Integration tests for key flows
- E2E tests for critical paths

---

## 🔒 Security

**Important notes for contributors:**

- **NEVER read or access** `android/keystore.properties` or `*.keystore` files
- **NEVER commit** keystore files or credentials to git
- Production keystore is stored securely outside the repository

---

## 📄 License

This project is currently unlicensed. All rights reserved.

---

## 🙏 Acknowledgments

- **Google ML Kit** - Digital Ink Recognition
- **Expo** - React Native development platform
- **React Navigation** - Navigation library
- **franc** - Language detection library
- **All contributors and beta testers**

---

## 📞 Contact

For questions, feedback, or bug reports:
- **Issues:** [GitHub Issues](https://github.com/yourusername/moa/issues)
- **Email:** your.email@example.com

---

**Built with ❤️ for Korean learners**
