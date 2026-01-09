import { Screen, ScreenTitle } from '../../components'
import DeckCard from '../../components/DeckCard';
import { useDecks } from '../../hooks/useDecks';
import { View, FlatList, Text } from 'react-native'

export default function LibraryScreen() {
  const { decks, loading, error, refresh } = useDecks();

  const handleDeckPress = (deckId: string) => {
    // TODO: Navigate to deck detail screen
    console.log('Deck pressed:', deckId);
  };

  return (
     <Screen>
      <ScreenTitle>Library</ScreenTitle>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeckCard deck={item} onPress={handleDeckPress} />
        )}
        ListEmptyComponent={
          <View>
            <Text>
              No decks yet.{'\n'}Create your first deck to get started!
            </Text>
          </View>
        }
        onRefresh={refresh}
        refreshing={loading}
      />
    </Screen>
  );
}
