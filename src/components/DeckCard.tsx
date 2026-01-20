import { Deck } from "../model/deck";
import { Text, TouchableOpacity } from 'react-native'

interface DeckCardProps {
  deck: Deck,
  onPress: (deckId: number) => void;
}

export default function DeckCard({ deck, onPress }: DeckCardProps) {
  return (
    <TouchableOpacity onPress={() => onPress(deck.id)}>
      <Text>{deck.name}</Text>
      <Text>{deck.cardCount} cards</Text>
    </TouchableOpacity>
  )
}
