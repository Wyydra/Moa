import { Deck } from "../services/deckService";
import { Text } from 'react-native'

interface DeckCardProps {
  deck: Deck,
  onPress: (deckId: string) => void;
}

export default function DeckCard({ deck, onPress }: DeckCardProps) {
  return (
    <Text>{deck.name}</Text>
  )
}
