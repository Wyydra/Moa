# 🪶 Moa - Learn Korean

> *Learn Korean, one word at a time.*

**Moa** (모아) means *"to gather"* in Korean — collecting words, knowledge, and small daily moments of progress.

A minimalist Korean learning app featuring spaced repetition flashcards, multiple study modes, handwriting recognition, and text-to-speech pronunciation.

---

## 🎮 Five Study Modes

### Learn Mode - Smart Flashcard Review
- Flip cards to reveal answers
- Rate your recall: Again / Hard / Good / Easy
- SM-2 spaced repetition algorithm adapts to your memory
- Progress tracked per card

### Write Mode - Handwriting Practice
- Draw Korean characters with your finger or stylus
- Google ML Kit recognition gives instant feedback
- Supports Korean and Japanese characters
- Practice writing with real-time validation

### Test Mode - Auto-Generated Quizzes
- Multiple choice questions from your decks
- Randomized answer options
- Instant feedback and scoring
- Session summary with accuracy percentage

### Match Mode - Timed Matching Game
- Match terms with definitions under time pressure
- Visual feedback with smooth animations
- Score tracking and completion time
- Fun, engaging way to reinforce vocabulary

### Browse Mode - Free Navigation
- Flip through cards without SRS pressure
- Simple Next/Previous navigation
- Perfect for quick review or casual browsing

**All modes include:**
- 🔄 Reverse cards toggle (swap question/answer)
- 🔊 Text-to-speech pronunciation buttons
- 🏷️ Tag-based filtering
- 🔀 Card shuffling option

---

## 🎧 Smart Text-to-Speech

- **Auto-language detection** - Automatically identifies Korean, Japanese, Chinese, English, French, Spanish, German, and Arabic
- **Speed control** - Adjust playback speed from 0.5x to 2.0x for better comprehension
- **Auto-play option** - Automatic pronunciation when cards appear
- **Per-tile TTS** - In Match mode, hear each tile pronounced independently

---

## ✍️ Handwriting Recognition

- **Google ML Kit integration** - Advanced on-device handwriting recognition
- **Real-time feedback** - See your strokes rendered instantly
- **Korean & Japanese support** - Download models for both languages
- **Infinite canvas** - Scroll seamlessly as you write
- **Modal input** - Pop-up handwriting keyboard for easy access

---

## 📊 Progress Tracking

- **Study streaks** - Track consecutive days of study for motivation
- **Accuracy statistics** - Monitor overall and per-deck performance
- **Card mastery levels** - See cards categorized as new / learning / mastered
- **Session history** - Review attempts, accuracy, and time invested
- **Motivational messages** - Get encouragement as you build streaks

---

## 📤 Import & Export

- **JSON format** - Export decks to portable `.moa` files
- **QR code sharing** - Generate and scan QR codes to share decks instantly
- **Deep linking** - Import decks via `moa://` URL scheme
- **File import** - Pick `.moa` files from your device storage
- **Validation** - Comprehensive error checking during import

---

## 🗂️ Deck Management

- Create custom decks with names, descriptions, and tags
- Add unlimited flashcards with front/back content
- Edit decks and cards anytime
- Tag-based organization for better categorization
- Deck-specific language settings
- Card list view with quick editing

---

## 🌍 Bilingual Interface

- **English** - Complete UI translation
- **French** - Full bilingual support
- Language switcher in Settings
- All user-facing text localized

---

## 🌸 Design Philosophy

Moa is built for learners who want to grow their Korean quietly and consistently.

**Core principles:**
- **Small steps every day** - "한 걸음씩 (one step at a time)"
- **Minimal visual noise** - Clean typography, calm colors
- **Encouraging progress** - Not perfection
- **Personal tool first** - Created to help learners review effectively, then shared with others

> *"Gather words, grow fluency. One Moa at a time."*

---

## 🔐 Offline-First & Privacy-Focused

All your data stays on your device. No account required. No internet needed for studying (except for downloading handwriting models or importing via URL).

**Free & Open** - No ads, no subscriptions, no data collection.

---

## 🚀 Getting Started (Developers)

```bash
# Clone and install
git clone https://github.com/yourusername/moa.git
cd moa
npm install

# Start development
npm start

# Build for Android
npx expo run:android --variant release
```

See [AGENTS.md](./AGENTS.md) for detailed build instructions and code style guidelines.

---

## 🏗️ Tech Stack

- **React Native** + **Expo** + **TypeScript**
- **React Navigation** v7
- **AsyncStorage** (local persistence)
- **SM-2** spaced repetition algorithm
- **expo-speech** (TTS)
- **Google ML Kit** Digital Ink Recognition
- **react-i18next** (English/French)

---

## 📂 Project Structure

```
src/
├── screens/       # Main app screens (Home, Study, Write, Test, Match, Browse, etc.)
├── components/    # Reusable UI (HandwritingCanvas, PronunciationButton, etc.)
├── data/          # Models and AsyncStorage persistence
├── utils/         # SRS algorithm, language detection, deep linking
├── i18n/          # Translations (EN/FR)
└── styles/        # Shared styles and constants
```

---

## 🎯 Development Status

**v1.0** - 92% Complete, awaiting Play Store validation

See [ROADMAP.md](./ROADMAP.md) for detailed progress and future plans.

---

## 📱 Play Store Submission Guide

### App Title (30 chars max)
**Moa - Learn Korean**

### Short Description (80 chars max)
Learn Korean with flashcards, handwriting, quizzes, and smart spaced repetition

### Keywords
korean learning, flashcards, spaced repetition, korean vocabulary, hangul practice, korean handwriting, language learning, study korean, korean quiz, vocabulary trainer, korean pronunciation, learn hangul, korean alphabet, topik preparation, korean study app

### Category
**Education**

### Target Audience
- Korean language learners (beginner to intermediate)
- Students preparing for TOPIK exams
- Self-study enthusiasts
- Language exchange participants
- Anyone wanting to maintain/improve Korean vocabulary
- Educators creating custom study materials for students

### Screenshots Needed (4-8 recommended)
- Home screen showing deck overview
- Learn mode with flashcard
- Write mode with handwriting canvas
- Test mode with quiz question
- Match mode with matching tiles
- Browse mode navigation
- Progress dashboard with streaks
- Settings screen

**Dimensions:** Minimum 320px, Maximum 3840px (use actual device resolution, e.g., 1080x2340)

### Assets Required
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] 4-8 phone screenshots
- [ ] Privacy policy (hosted URL - required)
- [ ] Signed AAB file

### Release Notes Template

**Version 1.0.0**

🎉 Initial release of Moa - Learn Korean!

**Features:**
- ✅ 5 study modes: Learn, Write, Test, Match, Browse
- ✅ Smart spaced repetition (SM-2 algorithm)
- ✅ Google ML Kit handwriting recognition
- ✅ Text-to-speech with auto-language detection
- ✅ Progress tracking with study streaks
- ✅ Import/export decks via JSON and QR codes
- ✅ Bilingual UI (English/French)

**What's coming in v1.1:**
- Spell mode (audio dictation)
- CSV import/export
- Study mode picker UI
- Enhanced test mode (true/false, written questions)

---

## 🔒 Security (Contributors)

- **NEVER** commit `android/keystore.properties` or `*.keystore` files
- Production keystore is stored securely outside the repository

---

## 📄 License

All rights reserved.
