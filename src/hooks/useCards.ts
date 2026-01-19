import { useState, useEffect, useCallback } from 'react';
import { Card, CreateCardInput } from '../model/card';
import { cardService } from '../services/CardService';

export function useCards(deckId: number) {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCards = useCallback(async () => {
        try {
            setLoading(true);
            const data = await cardService.getByDeckId(deckId);
            setCards(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [deckId]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    return { cards, loading, error, refresh: fetchCards };
}

export function useCreateCard() {
    const [loading, setLoading] = useState(false);

    const createCard = async (input: CreateCardInput) => {
        try {
            setLoading(true);
            const id = await cardService.create(input);
            return id;
        } finally {
            setLoading(false);
        }
    };

    return { createCard, loading };
}
