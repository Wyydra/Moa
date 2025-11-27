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
  deleted?: boolean;
  deletedAt?: number;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  cardCount: number;
  tags?: string[];
  language?: string; // BCP 47 language code (e.g., 'ko-KR', 'ja-JP', 'en-US')
  deleted?: boolean;
  deletedAt?: number;
}

export interface StudySession {
  id: string;
  deckId: string;
  cardId: string;
  timestamp: number; // Date studied
  response: 'again' | 'hard' | 'good' | 'easy'; // User response
  correct: boolean; // Whether answer was correct (for non-flashcard modes)
}
