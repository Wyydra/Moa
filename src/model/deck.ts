import { Tag } from './tag';

export interface Deck {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  cardCount: number;
  tags?: Tag[];
}

export interface CreateDeckInput {
  name: string;
  description?: string;
  tagIds?: number[];
}
