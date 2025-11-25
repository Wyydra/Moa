# 🪶 Moa

> *Learn Korean, one word at a time.*

**Moa** (모아) means *"to gather"* in Korean — collecting words, knowledge, and small daily moments of progress.

A minimalist Korean learning app featuring spaced repetition, multiple study modes, handwriting recognition, and text-to-speech.

---

## 🚀 Getting Started

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

## 🔒 Security

- **NEVER** commit `android/keystore.properties` or `*.keystore` files
- Production keystore is stored securely outside the repository

---

## 📄 License

All rights reserved.
