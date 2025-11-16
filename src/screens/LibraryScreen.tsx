import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, Pressable, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';
import { useCallback, useState } from "react";
import { Deck } from "../data/model";
import { deleteDeck, getAllDecks, getAllTags, getDecksByTags, getDeckById, importDeckFromJSON } from "../data/storage";
import { COLORS, SPACING } from '../utils/constants';
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';

export default function LibraryScreen({navigation}: any) {
  const { t } = useTranslation();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const loadDecks = async () => {
    const loadedDecks = await getAllDecks();
    setAllDecks(loadedDecks);
    setDecks(loadedDecks);
    
    const tags = await getAllTags();
    setAllTags(tags);
  };

  const filterByTags = async (tags: string[]) => {
    if (tags.length === 0) {
      setDecks(allDecks);
    } else {
      const filtered = await getDecksByTags(tags);
      setDecks(filtered);
    }
  };

  const handleTagPress = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    filterByTags(newSelectedTags);
  };

  const handleClearFilter = () => {
    setSelectedTags([]);
    setDecks(allDecks);
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

  const handleImportDeck = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const jsonString = await response.text();

      const newDeckId = await importDeckFromJSON(jsonString);
      const deck = await getDeckById(newDeckId);

      if (deck) {
        Alert.alert(
          t('common.success'),
          t('deck.importSuccess', { name: deck.name })
        );
        loadDecks();
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        t('common.error'),
        `${t('deck.importError')}\n\nDebug: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const renderDeck = ({ item, index }: { item: Deck, index: number }) => {
    return (
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
    );
  };

  return (
     <View style={commonStyles.container}>
      <Text style={commonStyles.screenTitle}>{t('library.title')}</Text>

      {allTags.length > 0 && (
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Ionicons name="funnel-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.filterLabel}>{t('library.filterByTags')}</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tagsFilter}
          >
            {allTags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterTagChip,
                  selectedTags.includes(tag) && styles.filterTagChipActive
                ]}
                onPress={() => handleTagPress(tag)}
              >
                <Text style={[
                  styles.filterTagText,
                  selectedTags.includes(tag) && styles.filterTagTextActive
                ]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedTags.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={handleClearFilter}
              >
                <Ionicons name="close-circle" size={16} color={COLORS.skyBlue} />
                <Text style={styles.clearFilterText}>{t('library.clearFilter')}</Text>
              </TouchableOpacity>
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={[styles.modeButton, styles.modeButtonLearn]}
                  onPress={() => navigation.navigate('StudyScreen', { tags: selectedTags })}
                >
                  <Ionicons name="book-outline" size={20} color="white" />
                  <Text style={styles.modeButtonText}>{t('modes.learn.title')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, styles.modeButtonTest]}
                  onPress={() => navigation.navigate('TestScreen', { tags: selectedTags })}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text style={styles.modeButtonText}>{t('modes.test.title')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, styles.modeButtonWrite]}
                  onPress={() => navigation.navigate('WriteScreen', { tags: selectedTags })}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                  <Text style={styles.modeButtonText}>{t('modes.write.title')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, styles.modeButtonMatch]}
                  onPress={() => navigation.navigate('MatchScreen', { tags: selectedTags })}
                >
                  <Ionicons name="grid-outline" size={20} color="white" />
                  <Text style={styles.modeButtonText}>{t('modes.match.title')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

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
            style={styles.importFab}
            onPress={handleImportDeck}
          >
            <Ionicons name="download-outline" size={24} color="white"/>
          </TouchableOpacity>
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
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  filterLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  tagsFilter: {
    marginBottom: SPACING.md,
    maxHeight: 40,
  },
  filterTagChip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: SPACING.sm,
  },
  filterTagChipActive: {
    backgroundColor: COLORS.skyBlue,
    borderColor: COLORS.skyBlue,
  },
  filterTagText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  filterTagTextActive: {
    color: 'white',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  clearFilterText: {
    color: COLORS.skyBlue,
    fontSize: 14,
    marginLeft: SPACING.xs,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  modeButtonLearn: {
    backgroundColor: COLORS.skyBlue,
  },
  modeButtonTest: {
    backgroundColor: '#34C759',
  },
  modeButtonWrite: {
    backgroundColor: '#FF9500',
  },
  modeButtonMatch: {
    backgroundColor: '#AF52DE',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  importFab: {
    position: 'absolute',
    bottom: 30,
    right: 100,
    backgroundColor: COLORS.coral,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
