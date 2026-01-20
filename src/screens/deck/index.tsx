import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { LibraryStackParamList } from '../../types/navigation';
import { Screen, ScreenTitle } from '../../components';
import { deckService } from '../../services/DeckService';
import { Deck } from '../../model/deck';

type DeckScreenRouteProp = RouteProp<LibraryStackParamList, 'DeckDetail'>;

export default function DeckScreen() {
    const route = useRoute<DeckScreenRouteProp>();
    const { deckId } = route.params;
    const [deck, setDeck] = useState<Deck | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDeck = async () => {
            try {
                const id = parseInt(deckId, 10);
                const data = await deckService.getById(id);
                setDeck(data);
            } catch (error) {
                console.error('Failed to load deck', error);
            } finally {
                setLoading(false);
            }
        };

        loadDeck();
    }, [deckId]);

    if (loading) {
        return (
            <Screen>
                <View>
                    <Text>Loading...</Text>
                </View>
            </Screen>
        );
    }

    if (!deck) {
        return (
            <Screen>
                <View>
                    <Text>Deck not found</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen safeAreaEdges={['bottom', 'left', 'right']}>
            <ScreenTitle>{deck.name}</ScreenTitle>
            <View>
                {deck.description && <Text>{deck.description}</Text>}
                <Text>Card count: {deck.cardCount}</Text>
            </View>
        </Screen>
    );
}
