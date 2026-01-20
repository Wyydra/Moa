import { Screen, ScreenTitle } from '../../components'
import DeckCard from '../../components/DeckCard';
import { useDecks } from '../../hooks/useDecks';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LibraryStackParamList } from '../../types/navigation';
import { View, FlatList, Text } from 'react-native'

type NavigationProp = NativeStackNavigationProp<LibraryStackParamList>;

export default function LibraryScreen() {
  const { decks, loading, error, refresh } = useDecks();
  const navigation = useNavigation<NavigationProp>();

  const handleDeckPress = (deckId: number) => {
    navigation.navigate('DeckDetail', { deckId: deckId.toString() });
  };

  return (
    <Screen>
      <ScreenTitle>Library</ScreenTitle>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id.toString()}
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
