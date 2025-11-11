import { TouchableOpacity, Text, View, StyleSheet, FlatList, Alert } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { deleteDeck, getCardsByDeck, getDeckById, getDueCards } from "../data/storage";
import { Card, Deck } from "../data/model";

export default function DeckDetailsScreen({route, navigation}: any) {
  const { deckId } = route.params;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCount, setDueCount] = useState(0);

  const loadDeckAndCards = async () => {
    const loadedDeck = await getDeckById(deckId);
    const loadedCards = await getCardsByDeck(deckId);
    const due = await getDueCards(deckId);
    setCards(loadedCards);
    setDeck(loadedDeck);
    setDueCount(due.length);
  };

  useFocusEffect(
    useCallback(() => {
      loadDeckAndCards();
    }, [deckId])
  );

  const handleAddCard = () => {
    navigation.navigate('AddCard', {deckId});
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditDeck = () => {
    navigation.navigate('EditDeck', { deckId });
  }

  const handleDeleteDeck = () => {
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck?.name}"? This will also delete all ${cards.length} cards in
      this deck.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            await deleteDeck(deckId);
            navigation.goBack();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleStudy = () => {
    navigation.navigate('StudyScreen', {deckId});
  }

  const renderCard = ({ item }: { item: Card }) => (
    <View style={[commonStyles.card, styles.cardItem]}>
      <Text style={styles.cardFront}>{item.front}</Text>
      <Text style={styles.cardBack}>{item.back}</Text>
    </View>
  );

  if (!deck) {
    return (
      <View style={commonStyles.container}>
      <Text style={commonStyles.emptyText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={[commonStyles.screenTitle, styles.title]}>{deck.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEditDeck} style={styles.actionButton}>
            <Ionicons name="create-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteDeck} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {deck.description && (
        <Text style={styles.description}>{deck.description}</Text>
      )}

      {dueCount > 0 && (
        <TouchableOpacity
          style={[commonStyles.button, styles.studyButton]}
          onPress={handleStudy}
        >
          <Ionicons name="school" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={commonStyles.buttonText}> Study now ({dueCount} due)</Text>
        </TouchableOpacity>
      )}

      {cards.length === 0 ? (
        <>
          <Text style={commonStyles.emptyText}>No cards in this deck</Text>
          <TouchableOpacity
            style={[commonStyles.button, styles.addButton]}
            onPress={handleAddCard}
          >
            <Text style={commonStyles.buttonText}>Add Your First Card</Text>
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddCard}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.md,
    marginTop: 60,
  },
  title: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    marginTop: 60,
  },
  actionButton: {
    marginLeft: SPACING.md,
  },
  description: {
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  addButton: {
    marginTop: SPACING.xl,
  },
  listContent: {
    paddingBottom: 100,
  },
  cardItem: {
    marginBottom: SPACING.md,
  },
  cardFront: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardBack: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: COLORS.skyBlue,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
});
