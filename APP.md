# 🪶 Moa

> *Learn Korean, one word at a time.*

---

## 🌱 Overview

**Moa** is a minimalist app to **learn and revise Korean** through a blend of **flashcards**, **mini-lessons**, and **handwriting practice**.

The name *Moa* (모아) means *"to gather"* in Korean — reflecting the idea of collecting words, knowledge, and small daily moments of progress.

Moa focuses on being calm, simple, and beautiful — a space where learning feels natural and consistent, not stressful.

---

## 🧩 Core Features

### 🧠 Spaced Repetition Flashcards

* Review vocabulary, phrases, and grammar patterns.
* Simple "flip & rate" interface like Anki.
* Smart scheduling that adapts to your memory pace.
* Organize cards by *tags* (e.g., "food", "grammar", "TOPIK I").

### 🎮 Multiple Study Modes (Quizlet-inspired)

* **Learn Mode** — Interactive flashcards with self-grading (Again/Hard/Good/Easy).
* **Write Mode** — Type the answer from memory (checks spelling accuracy).
* **Spell Mode** — Listen to audio and spell the word correctly.
* **Test Mode** — Auto-generated quiz with multiple choice, true/false, and written questions.
* **Match Mode** — Interactive game to match terms with definitions under time pressure.
* **Progress Dashboard** — Track accuracy percentage, study streaks, and weak spots.
* Switch between modes seamlessly within the same deck.

### 🗒️ Interactive Lessons

* Short lessons that mix explanation, examples, and small quizzes.
* Each lesson links to a set of flashcards for quick revision.
* Topics include Hangul, particles, tenses, and common expressions.

### ✍️ Handwriting Practice

* Draw Hangul characters directly on screen.
* Compare your handwriting with the correct version.
* Helps memorize structure and stroke order.
* Future versions may include automatic recognition.

### 🎧 Listening & Pronunciation

* **Text-to-Speech (TTS)** — Play pronunciation for any card with one tap.
* **Language Detection** — Automatically detects Korean/Japanese for proper pronunciation.
* **Speed Control** — Adjust playback speed (0.5x - 2.0x) for better comprehension.
* **Auto-Pronunciation** — Optional setting to automatically play audio when card appears.
* **Study Screen Integration** — Speaker button next to card text during review.
* **List View Audio** — Quick pronunciation playback from deck card lists.
* **Accessible Learning** — Helps auditory learners and improves pronunciation accuracy.

### ✏️ Spell Mode (Audio Dictation)

* **Listen & Type** — Hear the word/phrase spoken and type what you hear.
* **TTS Playback** — Text-to-speech plays the card content automatically.
* **Spelling Validation** — Check your answer against the correct spelling.
* **Handwriting Input** — Option to write by hand instead of typing.
* **Combines Skills** — Listening comprehension + spelling accuracy + writing practice.

### 📤 Share & Discover

* Scan QR codes to instantly receive decks from friends or teachers.
* Generate shareable QR codes for your custom decks and lessons.
* Browse a community library of popular study materials.
* Rate and review shared content to help others find quality resources.
* Build your personal collection by importing content from the community.

### 📊 Import & Export

* **Import from CSV** — Bulk import cards with front/back columns.
* **Import from Quizlet** — Paste Quizlet set URL to automatically import decks.
* **Export to CSV** — Back up your decks and share with others.
* **Print Study Guides** — Generate PDF study sheets from your decks.

---

## 🌸 Design Philosophy

Moa's goal is **to make daily study feel effortless**.
Each feature is designed around clarity, warmth, and focus.

**Principles:**

* Small steps every day — "한 걸음씩 (one step at a time)."
* Minimal visual noise — clean typography, pastel tones.
* Encouraging progress — not perfection.

Moa aims to be *a space you enjoy opening*, not another task on your list.

---

## 🎨 Branding

| Element       | Description                             |
| ------------- | --------------------------------------- |
| **Name**      | *Moa* (모아) — "to gather"                |
| **Tagline**   | "Gather words, grow fluency."           |
| **Logo Idea** | Soft circle or open notebook symbol.    |
| **Colors**    | Cream, sky blue, mint, and light coral. |
| **Tone**      | Gentle, modern, and focused.            |

---

## 🧱 Technical Overview

| Layer        | Technology                   |
| ------------ | ---------------------------- |
| UI           | **React Native + Expo**          |
| Core logic   | TypeScript                       |
| Data storage | Local storage (AsyncStorage)     |
| TTS          | Expo Speech                      |
| Handwriting  | Google ML Kit Digital Ink       |
| Recognition  | Native Android module (Kotlin)   |
| Sharing      | QR codes + Deep Linking          |

### Architecture

* `screens` → UI screens and navigation
* `components` → reusable UI components
* `data` → models, storage, SRS logic
* `utils` → constants, helpers
* Clean modular structure, offline-first

---

## 📱 Example Screens

| Screen         | Description                                      |
| -------------- | ------------------------------------------------ |
| **Home**       | Overview of today's goals, study streaks, and reviews due |
| **Flashcards** | Flip cards, rate recall (Again / Good / Easy)    |
| **Study Mode Picker** | Choose between Learn, Write, Spell, Test, or Match |
| **Test Mode**  | Auto-generated quiz with multiple choice and written questions |
| **Match Game** | Timed matching game to pair terms with definitions |
| **Write Mode** | Type answers and get instant spelling feedback   |
| **Lesson**     | Read mini-lesson → try quiz → add words to deck  |
| **Write**      | Handwriting canvas to draw Hangul and self-check |
| **Library**    | Browse your decks and discover shared content    |
| **Share**      | Generate QR code to share your deck with others  |
| **Progress**   | View detailed stats, accuracy trends, and achievements |

---

## 🗓️ Roadmap

| Phase                        | Goal                | Features                          |
| ---------------------------- | ------------------- | --------------------------------- |
| **1. MVP**                   | Validate experience | Flashcards + basic SRS            |
| **2. Study Modes**           | Add variety to practice | Test, Match, Write, Spell modes |
| **3. Progress Tracking**     | Motivate consistency | Streaks, accuracy stats, achievements |
| **4. Import/Export**         | Expand content access | CSV import/export, Quizlet import |
| **5. Lessons**               | Add learning flow   | Mini-lessons + linked cards       |
| **6. Handwriting**           | Enhance practice    | Canvas + compare mode             |
| **7. Audio & Pronunciation** | Broaden skills      | Native audio + repeat             |
| **8. Community**             | Expand content      | QR code sharing, deck discovery, community library |

---

## ✅ Implementation Status

### Completed Features

- ✅ **Basic App Structure** — React Native + Expo setup with navigation
- ✅ **Data Models** — Card, Deck, and SRS algorithm types
- ✅ **Storage Layer** — AsyncStorage for local persistence
- ✅ **SRS Algorithm** — SM-2 implementation for spaced repetition
- ✅ **Home Screen** — Overview of decks and study progress
- ✅ **Library Screen** — Browse and manage decks
- ✅ **Create Deck** — Add new decks with name and description
- ✅ **Edit Deck** — Modify existing deck properties
- ✅ **Add Cards** — Create flashcards with front/back content
- ✅ **Deck Details** — View deck stats and card list
- ✅ **Study Screen** — Flashcard review with flip animation and SRS ratings
- ✅ **Handwriting Canvas** — Korean handwriting input with ML Kit
  - ✅ Infinite scrollable canvas with auto-scroll on inactivity
  - ✅ Real-time stroke rendering with dark background
  - ✅ Automatic recognition after writing pause
  - ✅ Navigation arrows and clear button
  - ✅ Korean model download and initialization
- ✅ **Handwriting Test Screen** — Practice writing with modal input
  - ✅ Modal-based handwriting canvas (keyboard-style)
  - ✅ Text input field with handwriting button
  - ✅ Real-time recognition feedback
  - ✅ Answer validation and progress tracking
- ✅ **Native ML Kit Integration** — Google ML Kit Digital Ink Recognition
  - ✅ Custom Kotlin native module for Android
  - ✅ Model download and management (Korean/Japanese)
  - ✅ On-device recognition with stroke data
  - ✅ Language selection in Settings
  - ✅ Lifecycle management and error handling
- ✅ **Internationalization** — Multi-language support
  - ✅ English and French translations
  - ✅ Settings screen for language switching
  - ✅ React-i18next integration
- ✅ **QR Code Deck Sharing** — Offline deck distribution
  - ✅ Generate QR codes from decks
  - ✅ Deep linking for deck import
  - ✅ Share modal with QR display
  - ✅ Deck export to JSON format

### In Progress

- 🚧 **Dictation Mode** — Listen and write with handwriting input

### Planned Features

- 📋 **Text-to-Speech Pronunciation** — Listen to card pronunciation
  - ⏳ PronunciationButton component with language detection
  - ⏳ Integration in StudyScreen, DeckDetailsScreen, TestScreen
  - ⏳ Auto-pronunciation setting (play on card flip)
  - ⏳ Speech rate control (0.5x - 2.0x)
  - ⏳ Korean/Japanese language detection from text
  - ⏳ Speaker icon with speaking state animation
- ⏳ **Write Mode** — Type answers with spelling feedback
- ⏳ **Spell Mode** — Audio-based spelling practice with TTS
- ⏳ **Test Mode** — Auto-generated quizzes
- ⏳ **Match Mode** — Timed matching game
- ⏳ **Progress Dashboard** — Stats, streaks, and achievements
- ⏳ **Mini-Lessons** — Interactive learning modules
- ⏳ **CSV Import/Export** — Bulk card management
- ⏳ **Quizlet Import** — Import decks from Quizlet URLs
- ⏳ **Community Library** — Browse and rate shared content

---

## 🌿 Vision

Moa is built for learners who want to grow their Korean quietly and consistently.
No pressure, no clutter — just clear progress at your own rhythm.

> *"Gather words, grow fluency. One Moa at a time."*
