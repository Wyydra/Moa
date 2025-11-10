# 🪶 Moa

> *Learn Korean, one word at a time.*

---

## 🌱 Overview

**Moa** is a minimalist app to **learn and revise Korean** through a blend of **flashcards**, **mini-lessons**, and **handwriting practice**.

The name *Moa* (모아) means *“to gather”* in Korean — reflecting the idea of collecting words, knowledge, and small daily moments of progress.

Moa focuses on being calm, simple, and beautiful — a space where learning feels natural and consistent, not stressful.

---

## 🧩 Core Features

### 🧠 Spaced Repetition Flashcards

* Review vocabulary, phrases, and grammar patterns.
* Simple “flip & rate” interface like Anki.
* Smart scheduling that adapts to your memory pace.
* Organize cards by *tags* (e.g., “food”, “grammar”, “TOPIK I”).

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

* Play native audio for each word or sentence.
* Practice by repeating out loud and comparing recordings.

### 📤 Share & Discover

* Scan QR codes to instantly receive decks from friends or teachers.
* Generate shareable QR codes for your custom decks and lessons.
* Browse a community library of popular study materials.
* Rate and review shared content to help others find quality resources.
* Build your personal collection by importing content from the community.

---

## 🌸 Design Philosophy

Moa’s goal is **to make daily study feel effortless**.
Each feature is designed around clarity, warmth, and focus.

**Principles:**

* Small steps every day — “한 걸음씩 (one step at a time).”
* Minimal visual noise — clean typography, pastel tones.
* Encouraging progress — not perfection.

Moa aims to be *a space you enjoy opening*, not another task on your list.

---

## 🎨 Branding

| Element       | Description                             |
| ------------- | --------------------------------------- |
| **Name**      | *Moa* (모아) — “to gather”                |
| **Tagline**   | “Gather words, grow fluency.”           |
| **Logo Idea** | Soft circle or open notebook symbol.    |
| **Colors**    | Cream, sky blue, mint, and light coral. |
| **Tone**      | Gentle, modern, and focused.            |

---

## 🧱 Technical Overview

| Layer        | Technology                   |
| ------------ | ---------------------------- |
| UI           | **React Native + Expo**      |
| Core logic   | TypeScript                   |
| Data storage | Local storage (AsyncStorage) |
| Audio        | Expo AV                      |
| Handwriting  | React Native Canvas          |
| Sharing      | QR codes + Backend API       |

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
| **Home**       | Overview of today's goals and reviews due        |
| **Flashcards** | Flip cards, rate recall (Again / Good / Easy)    |
| **Lesson**     | Read mini-lesson → try quiz → add words to deck  |
| **Write**      | Handwriting canvas to draw Hangul and self-check |
| **Library**    | Browse your decks and discover shared content    |
| **Share**      | Generate QR code to share your deck with others  |

---

## 🗓️ Roadmap

| Phase                        | Goal                | Features                          |
| ---------------------------- | ------------------- | --------------------------------- |
| **1. MVP**                   | Validate experience | Flashcards + basic SRS            |
| **2. Lessons**               | Add learning flow   | Mini-lessons + linked cards       |
| **3. Handwriting**           | Enhance practice    | Canvas + compare mode             |
| **4. Audio & Pronunciation** | Broaden skills      | Native audio + repeat             |
| **5. Community**             | Expand content      | QR code sharing, deck discovery, community library |

---

## 🌿 Vision

Moa is built for learners who want to grow their Korean quietly and consistently.
No pressure, no clutter — just clear progress at your own rhythm.

> *“Gather words, grow fluency. One Moa at a time.”*
