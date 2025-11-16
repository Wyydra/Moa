import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, Pressable, Animated } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';
import { useCallback, useState, useRef } from "react";
import { Deck } from "../data/model";
import { deleteDeck, getAllDecks } from "../data/storage";
import { COLORS, SPACING } from '../utils/constants';
import { Ionicons } from "@expo/vector-icons";

export default function LibraryScreen({navigation}: any) {
  const { t } = useTranslation();
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
      t('library.deleteDeck'),
      t('library.deleteDeckConfirm', { name: deck.name, count: deck.cardCount }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          onPress: async () => {
            await deleteDeck(deck.id);
            loadDecks();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderDeck = ({ item, index }: { item: Deck, index: number }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    Animated.timing(animValue, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();

    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    return (
      <Animated.View
        style={{
          opacity: animValue,
          transform: [{ translateY }],
        }}
      >
        <TouchableOpacity
          style={[commonStyles.card, styles.deckCard]}
          onPress={() => handleDeckPress(item)}
        >
          <View style={styles.deckContent}>
            <View style={styles.deckInfo}>
              <Text style={styles.deckName}>{item.name}</Text>
              <Text style={styles.deckCount}>{t('library.cardCount', { count: item.cardCount })}</Text>
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
      </Animated.View>
    );
  };

  return (
     <View style={commonStyles.container}>
      <Text style={commonStyles.screenTitle}>{t('library.title')}</Text>

      {decks.length === 0 ? (
        <>
          <Text style={commonStyles.emptyText}>{t('library.noDecks')}</Text>
          <TouchableOpacity
            style={[commonStyles.button, styles.createButton]}
            onPress={handleCreateDeck}
          >
            <Text style={commonStyles.buttonText}>{t('library.createFirstDeck')}</Text>
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
              <Text style={styles.actionText}>{t('common.edit')}</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.actionText, styles.deleteText]}>{t('common.delete')}</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
