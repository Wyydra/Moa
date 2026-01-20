import { Card as CardType } from "../model/card";
import { Text, View } from 'react-native'

interface CardProps {
  card: CardType,
}

export default function Card({ card }: CardProps) {
  return (
    <View>
      <Text>{card.front}</Text>
      <Text>{card.back}</Text>
    </View>
  )
}
