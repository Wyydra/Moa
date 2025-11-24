import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, Pressable, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';
import { useCallback, useState } from "react";
import { Deck } from "../data/model";
import { deleteDeck, getAllDecks, getAllTags, getDecksByTags, getDeckById, importDeckFromJSON } from "../data/storage";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LibraryScreen({navigation}: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
      // Note: Using '*/*' because Android may not recognize .moa files as application/json
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const pickedFile = result.assets[0];
      
      // Validate file extension
      const fileName = pickedFile.name || '';
      if (!fileName.endsWith('.json') && !fileName.endsWith('.moa')) {
        Alert.alert(
          t('common.error'),
          t('deck.invalidFileType') || 'Please select a valid .moa or .json deck file'
        );
        return;
      }
      
      // Use legacy FileSystem API for better compatibility with document URIs
      const jsonString = await FileSystem.readAsStringAsync(pickedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Validate that the content is valid JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        Alert.alert(
          t('common.error'),
          t('deck.invalidFileFormat') || 'The selected file is not a valid deck file. Please select a .moa file exported from Moa.'
        );
        return;
      }
      
      // Validate that it has the expected structure
      if (!parsedData.version || !parsedData.deck || !parsedData.cards) {
        Alert.alert(
          t('common.error'),
          t('deck.invalidDeckStructure') || 'The selected file does not contain a valid deck structure.'
        );
        return;
      }

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
        `${t('deck.importError')}\n\n${error instanceof Error ? error.message : String(error)}`
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
      <View style={{ paddingTop: insets.top + SPACING.md }}>
        <Text style={commonStyles.screenTitle}>{t('library.title')}</Text>
      </View>

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
    marginTop: SPACING.xxl,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tagsFilter: {
    marginBottom: SPACING.lg,
    maxHeight: 44,
  },
  filterTagChip: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.md,
  },
  filterTagChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTagText: {
    color: COLORS.textMedium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  filterTagTextActive: {
    color: COLORS.textInverse,
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  clearFilterText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  modeButtonLearn: {
    backgroundColor: COLORS.learn,
  },
  modeButtonTest: {
    backgroundColor: COLORS.test,
  },
  modeButtonWrite: {
    backgroundColor: COLORS.write,
  },
  modeButtonMatch: {
    backgroundColor: COLORS.match,
  },
  modeButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.3,
  },
  listContent: {
    paddingBottom: 100,
  },
  deckCard: {
    marginBottom: SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
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
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  deckCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  menuButton: {
    padding: SPACING.md,
  },
  importFab: {
    position: 'absolute',
    bottom: 30,
    right: 104,
    backgroundColor: COLORS.accent,
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.colored(COLORS.accent),
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: COLORS.primary,
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.colored(COLORS.primary),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingBottom: 34,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  deleteText: {
    color: COLORS.danger,
  },
  actionDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.lg,
  },
});
