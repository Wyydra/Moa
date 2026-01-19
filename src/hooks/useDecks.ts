import { useState, useEffect, useCallback } from 'react';
import { Deck, CreateDeckInput } from '../model/deck';
import { deckService } from '../services/DeckService';

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deckService.getAll();
      setDecks(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return { decks, loading, error, refresh: fetchDecks };
}

export function useDeck(id: number) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDeck = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deckService.getById(id);
      setDeck(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  return { deck, loading, error, refresh: fetchDeck };
}

export function useCreateDeck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createDeck = async (input: CreateDeckInput) => {
    try {
      setLoading(true);
      const id = await deckService.create(input);
      return id;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createDeck, loading, error };
}

export function useDeleteDeck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteDeck = async (id: number) => {
    try {
      setLoading(true);
      await deckService.delete(id);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return { deleteDeck, loading, error };
}
