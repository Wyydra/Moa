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
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  cardCount: number;
  tags?: string[];
}
