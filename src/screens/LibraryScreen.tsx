import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { commonStyles } from '../styles/commonStyles';
import { useCallback, useState } from "react";
import { Deck } from "../data/model";
import { deleteDeck, getAllDecks } from "../data/storage";
import { COLORS, SPACING } from '../utils/constants';
import { Ionicons } from "@expo/vector-icons";

export default function LibraryScreen({navigation}: any) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  const loadDecks = async () => {
    const loadedDecks = await getAllDecks();
    setDecks(loadedDecks);
  };

  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [])
  );
 
  const handleCreateDeck = () => {
    navigation.navigate('CreateDeck');
  }

  const handleDeckPress = (deck: Deck) => {
    navigation.navigate('DeckDetails', {deckId: deck.id, deckName: deck.name });
  }

  const handleDeckMenu = (deck: Deck) => {
    setSelectedDeck(deck);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDeck(null);
  };

  const handleEdit = () => {
    closeModal();
    if (selectedDeck) {
      navigation.navigate('EditDeck', { deckId: selectedDeck.id });
    }
  };

  const handleDelete = () => {
    closeModal();
    if (selectedDeck) {
      handleDeleteDeck(selectedDeck);
    }
  };

  const handleDeleteDeck = (deck: Deck) => {
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck.name}"? This will also delete all ${deck.cardCount} cards in this deck.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            await deleteDeck(deck.id);
            loadDecks();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderDeck = ({ item }: { item: Deck }) => (
    <TouchableOpacity
      style={[commonStyles.card, styles.deckCard]}
      onPress={() => handleDeckPress(item)}
    >
      <View style={styles.deckContent}>
        <View style={styles.deckInfo}>
          <Text style={styles.deckName}>{item.name}</Text>
          <Text style={styles.deckCount}>{item.cardCount} cards</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeckMenu(item)}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
     <View style={commonStyles.container}>
      <Text style={commonStyles.screenTitle}>Library</Text>

      {decks.length === 0 ? (
        <>
          <Text style={commonStyles.emptyText}>No decks yet</Text>
          <TouchableOpacity
            style={[commonStyles.button, styles.createButton]}
            onPress={handleCreateDeck}
          >
            <Text style={commonStyles.buttonText}>Create Your First Deck</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <FlatList
            data={decks}
            renderItem={renderDeck}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={handleCreateDeck}
          >
            <Ionicons name="add" size={32} color="white"/>
          </TouchableOpacity>
        </>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={styles.actionSheet}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={24} color={COLORS.text} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  createButton: {
    marginTop: SPACING.xl,
  },
  listContent: {
    paddingBottom: 100,
  },
  deckCard: {
    marginBottom: SPACING.md,
  },
  deckContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  deckCount: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  menuButton: {
    padding: SPACING.sm,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  actionText: {
    fontSize: 17,
    color: COLORS.text,
  },
  deleteText: {
    color: '#FF3B30',
  },
  actionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
