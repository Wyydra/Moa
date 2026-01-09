import { useCallback, useEffect, useState } from "react";
import { Deck, getAllDecks } from "../services/deckService";

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllDecks();
      setDecks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const refresh = useCallback(() => {
    loadDecks();
  }, [loadDecks]);

  return { decks, loading, error, refresh };
}
