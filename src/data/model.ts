export interface Card {
  id: string;
  front: string; 
  back: string;
  deckId: string;
  nextReview: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
  createdAt: number;
  tags?: string[];
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  cardCount: number;
  tags?: string[];
  frontLanguage?: string; // BCP 47 code, 'app-language', or undefined (auto-detect)
  backLanguage?: string;  // BCP 47 code or undefined (auto-detect)
  // Legacy field for backward compatibility
  language?: string;
}

export interface StudySession {
  id: string;
  deckId: string;
  cardId: string;
  timestamp: number; // Date studied
  response: 'again' | 'hard' | 'good' | 'easy'; // User response
  correct: boolean; // Whether answer was correct (for non-flashcard modes)
}
