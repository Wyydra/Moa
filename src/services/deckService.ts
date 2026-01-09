import { randomUUID } from "expo-crypto";
import { getDatabase } from "../database";
import { now } from "../utils/dates";

interface DeckRow {
  id: string;
  name: string;
  description: string | null;
  created_at: number; 
  updated_at: number;
}

export interface Deck {
  id: string,
  name: string;
  description?: string;
  createdAt: Date; 
  updatedAt: Date;
}

export interface DeckWithStats extends Deck {
  cardCount: number;
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface CreateDeckInput {
  name: string;
  description?: string;
  tagIds?: string[];
}
export interface UpdateDeckInput {
  name?: string;
  description?: string;
}

function rowToDeck(row: DeckRow): Deck {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getAllDecks(): Promise<Deck[]> {
  const db = getDatabase()
  const rows = await db.getAllAsync<DeckRow>(
    'SELECT * FROM decks ORDER BY updated_at DESC'
  );
  return rows.map(rowToDeck)
}

export async function createDeck(input: CreateDeckInput): Promise<Deck> {
  const db = getDatabase();
  const id = randomUUID();
  const timestamp = now();

  await db.runAsync(
    'INSERT INTO decks (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.name, input.description || null, timestamp, timestamp]
  );

  const deck = await getDeckById(id);
  if (!deck) throw new Error('Failed to create deck');
  return deck;
}

export async function getDeckById(id: string): Promise<Deck | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<DeckRow>(
    'SELECT * FROM decks WHERE id = ?',
    [id]
  );
  return row ? rowToDeck(row) : null;
}
