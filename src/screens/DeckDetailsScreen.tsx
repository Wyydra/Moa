import { TouchableOpacity, Text, View, StyleSheet, FlatList, Alert, Modal } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { deleteDeck, getCardsByDeck, getDeckById, getDueCards } from "../data/storage";
import { Card, Deck } from "../data/model";

export default function DeckDetailsScreen({ route, navigation }: any) {
  const { deckId } = route.params;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [showModePicker, setShowModePicker] = useState(false);

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
    navigation.navigate('AddCard', { deckId });
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

  const handleEditCard = (card: Card) => {
    navigation.navigate('EditCard', { deckId, cardId: card.id });
  };

  const renderCard = ({ item }: { item: Card }) => (
    <TouchableOpacity 
      style={[commonStyles.card, styles.cardItem]}
      onPress={() => handleEditCard(item)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardFront}>{item.front}</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} />
        <Text style={styles.cardBack}>{item.back}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} style={styles.cardChevron} />
    </TouchableOpacity>
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
            <Ionicons name="trash-outline" size={24} color={COLORS.coral} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cards.length}</Text>
          <Text style={styles.statLabel}>Total Cards</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, dueCount > 0 && styles.statNumberDue]}>{dueCount}</Text>
          <Text style={styles.statLabel}>Due for Review</Text>
        </View>
      </View>

      {deck.description && (
        <Text style={styles.description}>{deck.description}</Text>
      )}

      <TouchableOpacity
        style={[commonStyles.button, styles.studyButton]}
        onPress={() => setShowModePicker(true)}
      >
        <Ionicons name="school-outline" size={20} color="white" style={{ marginRight: 8 }} />
        <Text style={commonStyles.buttonText}>Start Studying</Text>
      </TouchableOpacity>

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

      <Modal
        visible={showModePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModePicker(false)}
      >
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContent}>
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>Choose Study Mode</Text>
              <TouchableOpacity onPress={() => setShowModePicker(false)}>
                <Text style={commonStyles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => {
                setShowModePicker(false);
                navigation.navigate('StudyScreen', { deckId });
              }}
            >
              <Ionicons name="book-outline" size={24} color={COLORS.skyBlue} />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Learn</Text>
                <Text style={styles.modeDescription}>Review cards with spaced repetition</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => {
                setShowModePicker(false);
                navigation.navigate('WriteScreen', { deckId });
              }}
            >
              <Ionicons name="create-outline" size={24} color={COLORS.skyBlue} />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Write</Text>
                <Text style={styles.modeDescription}>Type out the answers</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => {
                setShowModePicker(false);
                navigation.navigate('TestScreen', { deckId });
              }}
            >
              <Ionicons name="clipboard-outline" size={24} color={COLORS.skyBlue} />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Test</Text>
                <Text style={styles.modeDescription}>Take a multiple-choice quiz</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => {
                setShowModePicker(false);
                navigation.navigate('MatchScreen', { deckId });
              }}
            >
              <Ionicons name="git-compare-outline" size={24} color={COLORS.skyBlue} />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Match</Text>
                <Text style={styles.modeDescription}>Match terms and definitions</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeOption, styles.modeOptionDisabled]}
              disabled={true}
            >
              <Ionicons name="mic-outline" size={24} color={COLORS.textLight} />
              <View style={styles.modeTextContainer}>
                <Text style={[styles.modeTitle, styles.modeDisabled]}>Spell</Text>
                <Text style={[styles.modeDescription, styles.modeDisabled]}>Listen and type what you hear (coming soon)</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  cardChevron: {
    marginLeft: SPACING.sm,
  },
  cardFront: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  cardBack: {
    fontSize: 16,
    color: COLORS.textLight,
    flex: 1,
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statNumberDue: {
    color: COLORS.skyBlue,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modeOptionDisabled: {
    opacity: 0.5,
  },
  modeTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  modeDisabled: {
    color: COLORS.textLight,
  },
});
