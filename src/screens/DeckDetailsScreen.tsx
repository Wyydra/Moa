import { TouchableOpacity, Text, View, StyleSheet, FlatList, Alert, Modal, BackHandler, TextInput, ScrollView, Dimensions } from "react-native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState, useEffect } from "react";
import { deleteDeck, exportDeckToJSON, getCardsByDeck, getDeckById, getDueCards, deleteCard, saveCard, getAllDecks, moveCardsToAnotherDeck } from "../data/storage";
import { Card, Deck } from "../data/model";
import { encodeDeckToUrl as encodeDeckToURL } from "../utils/deepLinking";
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CardStatus = 'new' | 'learning' | 'mastered';
type ViewMode = 'list' | 'grid';

export default function DeckDetailsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { deckId } = route.params;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [showModePicker, setShowModePicker] = useState(false);
  const [deckJSON, setDeckJSON] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  
  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagModalMode, setTagModalMode] = useState<'add' | 'remove'>('add');
  const [tagInput, setTagInput] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Card tag filtering state
  const [allCardTags, setAllCardTags] = useState<string[]>([]);
  const [selectedCardTags, setSelectedCardTags] = useState<string[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);

  // Helper function to determine card status based on SRS data
  const getCardStatus = (card: Card): CardStatus => {
    if (card.repetitions === 0) return 'new';
    if (card.interval < 21) return 'learning';
    return 'mastered';
  };

  // Helper function to get color for card status
  const getStatusColor = (status: CardStatus): string => {
    switch (status) {
      case 'new': return COLORS.success;
      case 'learning': return COLORS.warning;
      case 'mastered': return COLORS.info;
    }
  };

  // Helper function to get status label
  const getStatusLabel = (status: CardStatus): string => {
    switch (status) {
      case 'new': return t('deck.statusNew');
      case 'learning': return t('deck.statusLearning');
      case 'mastered': return t('deck.statusMastered');
    }
  };

  // Helper function to format next review date
  const formatNextReview = (nextReview: number): string => {
    const now = Date.now();
    const diff = nextReview - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return t('deck.dueToday');
    if (days === 1) return t('deck.dueTomorrow');
    return t('deck.dueInDays', { count: days });
  };

  const loadDeckAndCards = async () => {
    setIsLoading(true);
    setDeck(null);
    setCards([]);
    setDueCount(0);
    const loadedDeck = await getDeckById(deckId);
    const loadedCards = await getCardsByDeck(deckId);
    const due = await getDueCards(deckId);
    setCards(loadedCards);
    setDeck(loadedDeck);
    setDueCount(due.length);
    
    // Extract unique tags from all cards
    const uniqueTags = new Set<string>();
    loadedCards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    setAllCardTags(Array.from(uniqueTags).sort());
    setFilteredCards(loadedCards);
    setSelectedCardTags([]);
    
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadDeckAndCards();
    }, [deckId])
  );

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectionMode) {
        setSelectionMode(false);
        setSelectedCardIds([]);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [selectionMode]);

  const handleAddCard = () => {
    navigation.navigate('AddCard', { deckId });
  };

  const handleBack = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedCardIds([]);
    } else {
      navigation.navigate('LibraryList');
    }
  };

  const handleEditDeck = () => {
    setShowOverflowMenu(false);
    navigation.navigate('EditDeck', { deckId });
  }

  const handleDeleteDeck = () => {
    setShowOverflowMenu(false);
    Alert.alert(
      t('deck.deleteDeck'),
      t('deck.deleteConfirm', { name: deck?.name, count: cards.length }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          onPress: async () => {
            void deleteDeck(deckId);
            navigation.goBack();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleShareDeck = async () => {
    setShowOverflowMenu(false);
    try {
      const json = await exportDeckToJSON(deckId);
      const deepLink = encodeDeckToURL(json);
      setDeckJSON(deepLink);
      setShowQRModal(true);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        t('common.error'), 
        `${t('deck.exportError')}\n\nDebug: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const handleExportFile = async () => {
    try {
      const json = await exportDeckToJSON(deckId);
      const fileName = `${deck?.name.replace(/[^a-z0-9]/gi, '_')}_deck.moa`;
      const file = new File(Paths.cache, fileName);
      
      await file.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: t('deck.exportDeck'),
          UTI: 'public.json',
        });
      } else {
        Alert.alert(t('common.error'), t('deck.shareNotAvailable'));
      }
    } catch (error) {
      console.error('Export file error:', error);
      Alert.alert(
        t('common.error'),
        `${t('deck.exportError')}\n\nDebug: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const handleEditCard = (card: Card) => {
    if (selectionMode) {
      toggleCardSelection(card.id);
    } else {
      navigation.navigate('EditCard', { deckId, cardId: card.id });
    }
  };

  const handleLongPressCard = (card: Card) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedCardIds([card.id]);
    }
  };

  // Bulk Selection Functions
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedCardIds([]);
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCardIds(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCardIds.length === cards.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(cards.map(card => card.id));
    }
  };

  // Card tag filtering functions
  const filterCardsByTags = (tags: string[]) => {
    if (tags.length === 0) {
      setFilteredCards(cards);
    } else {
      const filtered = cards.filter(card => 
        card.tags && card.tags.some(tag => tags.includes(tag))
      );
      setFilteredCards(filtered);
    }
  };

  const handleCardTagPress = (tag: string) => {
    const newSelectedTags = selectedCardTags.includes(tag)
      ? selectedCardTags.filter(t => t !== tag)
      : [...selectedCardTags, tag];
    
    setSelectedCardTags(newSelectedTags);
    filterCardsByTags(newSelectedTags);
  };

  const handleClearCardFilter = () => {
    setSelectedCardTags([]);
    setFilteredCards(cards);
  };

  const handleBulkDelete = () => {
    Alert.alert(
      t('card.bulkDelete'),
      t('card.bulkDeleteConfirm', { count: selectedCardIds.length }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedCardIds.map(id => deleteCard(id))
              );
              Alert.alert(t('common.success'), t('card.deleteSuccess', { count: selectedCardIds.length }));
              setSelectionMode(false);
              setSelectedCardIds([]);
              void loadDeckAndCards();
            } catch (error) {
              console.error('Bulk delete error:', error);
              Alert.alert(t('common.error'), 'Failed to delete cards');
            }
          }
        }
      ]
    );
  };

  const handleBulkResetProgress = () => {
    Alert.alert(
      t('card.bulkReset'),
      t('card.bulkResetConfirm', { count: selectedCardIds.length }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('card.bulkReset'),
          onPress: async () => {
            try {
              const cardsToReset = cards.filter(card => selectedCardIds.includes(card.id));
              await Promise.all(
                cardsToReset.map(card => {
                  const resetCard: Card = {
                    ...card,
                    nextReview: Date.now(),
                    interval: 0,
                    easeFactor: 2.5,
                    repetitions: 0,
                  };
                  return saveCard(resetCard);
                })
              );
              Alert.alert(t('common.success'), t('card.resetSuccess', { count: selectedCardIds.length }));
              setSelectionMode(false);
              setSelectedCardIds([]);
              void loadDeckAndCards();
            } catch (error) {
              console.error('Bulk reset error:', error);
              Alert.alert(t('common.error'), 'Failed to reset progress');
            }
          }
        }
      ]
    );
  };

  const handleBulkExport = async () => {
    setShowBulkActionsMenu(false);
    try {
      const selectedCards = cards.filter(card => selectedCardIds.includes(card.id));
      const exportData = {
        version: '1.0',
        deck: {
          name: `${deck?.name} (${selectedCardIds.length} cards)`,
          description: deck?.description,
          tags: deck?.tags,
          language: deck?.language,
        },
        cards: selectedCards.map(card => ({
          front: card.front,
          back: card.back,
        })),
        exportedAt: Date.now(),
      };

      const json = JSON.stringify(exportData);
      const fileName = `${deck?.name.replace(/[^a-z0-9]/gi, '_')}_selected_cards.moa`;
      const file = new File(Paths.cache, fileName);
      
      await file.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: t('card.bulkExport'),
          UTI: 'public.json',
        });
        Alert.alert(t('common.success'), t('card.exportSuccess', { count: selectedCardIds.length }));
      } else {
        Alert.alert(t('common.error'), t('deck.shareNotAvailable'));
      }
    } catch (error) {
      console.error('Bulk export error:', error);
      Alert.alert(t('common.error'), 'Failed to export cards');
    }
  };

  const handleBulkMove = async () => {
    setShowBulkActionsMenu(false);
    try {
      const decks = await getAllDecks();
      // Filter out current deck
      const otherDecks = decks.filter(d => d.id !== deckId);
      
      if (otherDecks.length === 0) {
        Alert.alert(t('common.error'), t('card.noOtherDecks'));
        return;
      }

      setAvailableDecks(otherDecks);
      setShowDeckPicker(true);
    } catch (error) {
      console.error('Error loading decks:', error);
      Alert.alert(t('common.error'), 'Failed to load decks');
    }
  };

  const handleMoveToSelectedDeck = async (targetDeckId: string) => {
    setShowDeckPicker(false);
    try {
      await moveCardsToAnotherDeck(selectedCardIds, targetDeckId);
      const targetDeck = availableDecks.find(d => d.id === targetDeckId);
      Alert.alert(
        t('common.success'), 
        t('card.moveSuccess', { count: selectedCardIds.length, deck: targetDeck?.name })
      );
      setSelectionMode(false);
      setSelectedCardIds([]);
      void loadDeckAndCards();
    } catch (error) {
      console.error('Move cards error:', error);
      Alert.alert(t('common.error'), 'Failed to move cards');
    }
  };

  const handleBulkAddTags = () => {
    setShowBulkActionsMenu(false);
    setTagModalMode('add');
    setTagsToAdd([]);
    setTagInput('');
    setShowTagModal(true);
  };

  const handleBulkRemoveTags = () => {
    setShowBulkActionsMenu(false);
    setTagModalMode('remove');
    
    // Collect all unique tags from selected cards
    const selectedCards = cards.filter(card => selectedCardIds.includes(card.id));
    const allTags = new Set<string>();
    selectedCards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => allTags.add(tag));
      }
    });
    setAvailableTags(Array.from(allTags));
    setTagsToRemove([]);
    setShowTagModal(true);
  };

  const handleAddTagToList = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tagsToAdd.includes(trimmedTag)) {
      setTagsToAdd([...tagsToAdd, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTagFromList = (tag: string) => {
    setTagsToAdd(tagsToAdd.filter(t => t !== tag));
  };

  const toggleTagForRemoval = (tag: string) => {
    if (tagsToRemove.includes(tag)) {
      setTagsToRemove(tagsToRemove.filter(t => t !== tag));
    } else {
      setTagsToRemove([...tagsToRemove, tag]);
    }
  };

  const handleConfirmAddTags = async () => {
    if (tagsToAdd.length === 0) {
      Alert.alert(t('common.error'), 'Please add at least one tag');
      return;
    }

    setShowTagModal(false);
    try {
      const selectedCards = cards.filter(card => selectedCardIds.includes(card.id));
      await Promise.all(
        selectedCards.map(card => {
          const existingTags = card.tags || [];
          const newTags = [...new Set([...existingTags, ...tagsToAdd])]; // Merge and deduplicate
          const updatedCard: Card = {
            ...card,
            tags: newTags,
          };
          return saveCard(updatedCard);
        })
      );
      Alert.alert(t('common.success'), t('card.tagsAddedSuccess', { count: selectedCardIds.length }));
      setSelectionMode(false);
      setSelectedCardIds([]);
      void loadDeckAndCards();
    } catch (error) {
      console.error('Bulk add tags error:', error);
      Alert.alert(t('common.error'), 'Failed to add tags');
    }
  };

  const handleConfirmRemoveTags = async () => {
    if (tagsToRemove.length === 0) {
      Alert.alert(t('common.error'), 'Please select at least one tag to remove');
      return;
    }

    setShowTagModal(false);
    try {
      const selectedCards = cards.filter(card => selectedCardIds.includes(card.id));
      await Promise.all(
        selectedCards.map(card => {
          const existingTags = card.tags || [];
          const newTags = existingTags.filter(tag => !tagsToRemove.includes(tag));
          const updatedCard: Card = {
            ...card,
            tags: newTags.length > 0 ? newTags : undefined,
          };
          return saveCard(updatedCard);
        })
      );
      Alert.alert(t('common.success'), t('card.tagsRemovedSuccess', { count: selectedCardIds.length }));
      setSelectionMode(false);
      setSelectedCardIds([]);
      void loadDeckAndCards();
    } catch (error) {
      console.error('Bulk remove tags error:', error);
      Alert.alert(t('common.error'), 'Failed to remove tags');
    }
  };

  const renderCardListItem = ({ item }: { item: Card }) => {
    const status = getCardStatus(item);
    const statusColor = getStatusColor(status);
    const statusLabel = getStatusLabel(status);
    const nextReviewText = formatNextReview(item.nextReview);
    const isSelected = selectedCardIds.includes(item.id);

    return (
      <TouchableOpacity 
        style={[
          commonStyles.card, 
          styles.cardItem,
          isSelected && styles.cardItemSelected
        ]}
        onPress={() => handleEditCard(item)}
        onLongPress={() => handleLongPressCard(item)}
      >
        <View style={styles.cardContent}>
          {selectionMode ? (
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={24} 
              color={isSelected ? COLORS.primary : COLORS.textLight} 
            />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          )}
          <View style={styles.cardTextContainer}>
            <View style={styles.cardMainRow}>
              <Text style={styles.cardFront} numberOfLines={1}>{item.front}</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textLight} style={styles.arrowIcon} />
              <Text style={styles.cardBack} numberOfLines={1}>{item.back}</Text>
            </View>
            {item.tags && item.tags.length > 0 && (
              <View style={styles.cardTagsRow}>
                {item.tags.map((tag, index) => (
                  <View key={index} style={styles.cardTagChip}>
                    <Text style={styles.cardTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.cardMeta}>{statusLabel} • {nextReviewText}</Text>
          </View>
          {!selectionMode && (
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCardGridItem = ({ item }: { item: Card }) => {
    const status = getCardStatus(item);
    const statusColor = getStatusColor(status);
    const statusLabel = getStatusLabel(status);
    const isSelected = selectedCardIds.includes(item.id);

    return (
      <TouchableOpacity 
        style={[
          commonStyles.card, 
          styles.gridCardItem,
          isSelected && styles.cardItemSelected
        ]}
        onPress={() => handleEditCard(item)}
        onLongPress={() => handleLongPressCard(item)}
      >
        {selectionMode ? (
          <Ionicons 
            name={isSelected ? "checkbox" : "square-outline"} 
            size={20} 
            color={isSelected ? COLORS.primary : COLORS.textLight} 
            style={styles.statusDotGrid}
          />
        ) : (
          <View style={[styles.statusDot, styles.statusDotGrid, { backgroundColor: statusColor }]} />
        )}
        <Text style={styles.gridCardFront} numberOfLines={2}>{item.front}</Text>
        <Text style={styles.gridCardBack} numberOfLines={2}>{item.back}</Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.cardTagsRow}>
            {item.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.cardTagChip}>
                <Text style={styles.cardTagText} numberOfLines={1}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 2 && (
              <Text style={styles.cardTagText}>+{item.tags.length - 2}</Text>
            )}
          </View>
        )}
        <Text style={styles.gridCardMeta}>{statusLabel}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading || !deck) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.emptyText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {selectionMode ? t('card.selected', { count: selectedCardIds.length }) : deck.name}
          </Text>
        </View>
        {!selectionMode && (
          <TouchableOpacity onPress={() => setShowOverflowMenu(true)} style={styles.overflowButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Inline Stats Badges */}
      {!selectionMode && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="albums-outline" size={16} color={COLORS.textMedium} />
              <Text style={styles.statBadgeText}>
                {t('deck.cardCount', { count: cards.length })}
              </Text>
            </View>
            <View style={[styles.statBadge, dueCount > 0 && styles.statBadgeDue]}>
              <Ionicons name="time-outline" size={16} color={dueCount > 0 ? COLORS.primary : COLORS.textMedium} />
              <Text style={[styles.statBadgeText, dueCount > 0 && styles.statBadgeTextDue]}>
                {t('deck.dueCount', { count: dueCount })}
              </Text>
            </View>
          </View>

          {/* Tags */}
          {deck.tags && deck.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {deck.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {deck.description && (
            <Text style={styles.description}>{deck.description}</Text>
          )}

          {/* Card Tag Filter */}
          {allCardTags.length > 0 && (
            <View style={styles.cardFilterSection}>
              <View style={styles.cardFilterHeader}>
                <Ionicons name="funnel-outline" size={16} color={COLORS.textLight} />
                <Text style={styles.cardFilterLabel}>{t('card.filterByTag')}</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.cardTagsFilter}
              >
                {allCardTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.cardFilterTagChip,
                      selectedCardTags.includes(tag) && styles.cardFilterTagChipActive
                    ]}
                    onPress={() => handleCardTagPress(tag)}
                  >
                    <Text style={[
                      styles.cardFilterTagText,
                      selectedCardTags.includes(tag) && styles.cardFilterTagTextActive
                    ]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedCardTags.length > 0 && (
                <TouchableOpacity
                  style={styles.clearCardFilterButton}
                  onPress={handleClearCardFilter}
                >
                  <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.clearCardFilterText}>{t('library.clearFilter')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Study Button */}
          <TouchableOpacity
            style={[commonStyles.button, styles.studyButton]}
            onPress={() => setShowModePicker(true)}
          >
            <Ionicons name="school-outline" size={22} color={COLORS.textInverse} />
            <Text style={commonStyles.buttonText}>{t('deck.startStudying')}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Cards Section Header with View Toggle and Select */}
      <View style={styles.cardsSectionHeader}>
        {selectionMode ? (
          <TouchableOpacity 
            style={styles.selectAllButton}
            onPress={handleSelectAll}
          >
            <Text style={styles.selectAllText}>
              {selectedCardIds.length === cards.length ? t('card.deselectAll') : t('card.selectAll')}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.cardsSectionTitle}>
            {t('deck.cardsSection')}
          </Text>
        )}
        <View style={styles.headerRightActions}>
          {selectionMode ? (
            <>
              {selectedCardIds.length > 0 && (
                <>
                  <TouchableOpacity onPress={handleBulkDelete} style={styles.actionIconButton}>
                    <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleBulkResetProgress} style={styles.actionIconButton}>
                    <Ionicons name="refresh-outline" size={22} color={COLORS.textMedium} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowBulkActionsMenu(true)} style={styles.actionIconButton}>
                    <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textMedium} />
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.viewToggle}>
                <TouchableOpacity 
                  style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
                  onPress={() => setViewMode('list')}
                >
                  <Ionicons 
                    name="list" 
                    size={20} 
                    color={viewMode === 'list' ? COLORS.primary : COLORS.textLight} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.viewToggleButton, viewMode === 'grid' && styles.viewToggleButtonActive]}
                  onPress={() => setViewMode('grid')}
                >
                  <Ionicons 
                    name="grid" 
                    size={20} 
                    color={viewMode === 'grid' ? COLORS.primary : COLORS.textLight} 
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={toggleSelectionMode}
              >
                <Text style={styles.selectButtonText}>{t('card.select')}</Text>
              </TouchableOpacity>
              <View style={styles.viewToggle}>
                <TouchableOpacity 
                  style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
                  onPress={() => setViewMode('list')}
                >
                  <Ionicons 
                    name="list" 
                    size={20} 
                    color={viewMode === 'list' ? COLORS.primary : COLORS.textLight} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.viewToggleButton, viewMode === 'grid' && styles.viewToggleButtonActive]}
                  onPress={() => setViewMode('grid')}
                >
                  <Ionicons 
                    name="grid" 
                    size={20} 
                    color={viewMode === 'grid' ? COLORS.primary : COLORS.textLight} 
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Cards List/Grid */}
      {cards.length === 0 ? (
        <>
          <Text style={commonStyles.emptyText}>{t('deck.noCards')}</Text>
          <TouchableOpacity
            style={[commonStyles.button, styles.addButton]}
            onPress={handleAddCard}
          >
            <Text style={commonStyles.buttonText}>{t('deck.addFirstCard')}</Text>
          </TouchableOpacity>
        </>
      ) : filteredCards.length === 0 ? (
        <Text style={commonStyles.emptyText}>{t('deck.noCardsMatchFilter')}</Text>
      ) : (
        <FlatList
          data={filteredCards}
          renderItem={viewMode === 'list' ? renderCardListItem : renderCardGridItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          key={viewMode}
        />
      )}

      {/* FAB */}
      {!selectionMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddCard}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}

      {/* Bulk Actions More Menu Modal */}
      <Modal
        visible={showBulkActionsMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowBulkActionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.overflowOverlay}
          activeOpacity={1}
          onPress={() => setShowBulkActionsMenu(false)}
        >
          <View style={styles.overflowMenu}>
            <TouchableOpacity style={styles.overflowMenuItem} onPress={handleBulkAddTags}>
              <Ionicons name="pricetag-outline" size={22} color={COLORS.primary} />
              <Text style={styles.overflowMenuText}>{t('card.bulkAddTags')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.overflowMenuItem} onPress={handleBulkRemoveTags}>
              <Ionicons name="pricetags-outline" size={22} color={COLORS.primary} />
              <Text style={styles.overflowMenuText}>{t('card.bulkRemoveTags')}</Text>
            </TouchableOpacity>
            <View style={styles.overflowDivider} />
            <TouchableOpacity style={styles.overflowMenuItem} onPress={handleBulkMove}>
              <Ionicons name="folder-outline" size={22} color={COLORS.primary} />
              <Text style={styles.overflowMenuText}>{t('card.bulkMove')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.overflowMenuItem} onPress={handleBulkExport}>
              <Ionicons name="download-outline" size={22} color={COLORS.primary} />
              <Text style={styles.overflowMenuText}>{t('card.bulkExport')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Overflow Menu Modal */}
      <Modal
        visible={showOverflowMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOverflowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.overflowOverlay}
          activeOpacity={1}
          onPress={() => setShowOverflowMenu(false)}
        >
          <View style={styles.overflowMenu}>
            <TouchableOpacity style={styles.overflowMenuItem} onPress={handleShareDeck}>
              <Ionicons name="share-outline" size={22} color={COLORS.primary} />
              <Text style={styles.overflowMenuText}>{t('deck.shareDeck')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.overflowMenuItem} 
              onPress={async () => {
                setShowOverflowMenu(false);
                await handleExportFile();
              }}
            >
              <Ionicons name="download-outline" size={22} color={COLORS.primary} />
              <Text style={styles.overflowMenuText}>{t('deck.exportAsFile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overflowMenuItem} onPress={handleEditDeck}>
              <Ionicons name="create-outline" size={22} color={COLORS.textMedium} />
              <Text style={styles.overflowMenuText}>{t('deck.editDeckInfo')}</Text>
            </TouchableOpacity>

            <View style={styles.overflowDivider} />

            <TouchableOpacity style={styles.overflowMenuItem} onPress={handleDeleteDeck}>
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              <Text style={[styles.overflowMenuText, styles.overflowMenuTextDanger]}>
                {t('deck.deleteDeck')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Study Mode Picker Modal */}
      <Modal
        visible={showModePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModePicker(false)}
      >
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContent}>
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>{t('study.chooseMode')}</Text>
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
              <Ionicons name="book-outline" size={28} color={COLORS.learn} />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>{t('modes.learn.title')}</Text>
                <Text style={styles.modeDescription}>{t('modes.learn.description')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => {
                setShowModePicker(false);
                navigation.navigate('WriteScreen', { deckId });
              }}
            >
              <Ionicons name="create-outline" size={28} color={COLORS.write} />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>{t('modes.write.title')}</Text>
                <Text style={styles.modeDescription}>{t('modes.write.description')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => {
                setShowModePicker(false);
                navigation.navigate('TestScreen', { deckId });
              }}
            >
              <Ionicons name="clipboard-outline" size={28} color={COLORS.test} />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>{t('modes.test.title')}</Text>
                <Text style={styles.modeDescription}>{t('modes.test.description')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => {
                setShowModePicker(false);
                navigation.navigate('MatchScreen', { deckId });
              }}
            >
              <Ionicons name="git-compare-outline" size={28} color={COLORS.match} />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>{t('modes.match.title')}</Text>
                <Text style={styles.modeDescription}>{t('modes.match.description')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeOption, styles.modeOptionDisabled]}
              disabled={true}
            >
              <Ionicons name="mic-outline" size={24} color={COLORS.textLight} />
              <View style={styles.modeTextContainer}>
                <Text style={[styles.modeTitle, styles.modeDisabled]}>{t('modes.spell.title')}</Text>
                <Text style={[styles.modeDescription, styles.modeDisabled]}>{t('modes.spell.description')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Deck Picker Modal for Moving Cards */}
      <Modal
        visible={showDeckPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeckPicker(false)}
      >
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContent}>
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>{t('card.selectTargetDeck')}</Text>
              <TouchableOpacity onPress={() => setShowDeckPicker(false)}>
                <Text style={commonStyles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableDecks}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deckPickerItem}
                  onPress={() => handleMoveToSelectedDeck(item.id)}
                >
                  <View style={styles.deckPickerInfo}>
                    <Text style={styles.deckPickerName}>{item.name}</Text>
                    <Text style={styles.deckPickerMeta}>
                      {t('deck.cardCount', { count: item.cardCount })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Tag Management Modal */}
      <Modal
        visible={showTagModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContent}>
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>
                {tagModalMode === 'add' ? t('card.bulkAddTags') : t('card.bulkRemoveTags')}
              </Text>
              <TouchableOpacity onPress={() => setShowTagModal(false)}>
                <Text style={commonStyles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {tagModalMode === 'add' ? (
              <>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder={t('card.tagsPlaceholder')}
                    onSubmitEditing={handleAddTagToList}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={handleAddTagToList} style={styles.addTagButton}>
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {tagsToAdd.length > 0 && (
                  <View style={styles.modalTagsContainer}>
                    {tagsToAdd.map((tag, index) => (
                      <View key={index} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => handleRemoveTagFromList(tag)}>
                          <Ionicons name="close-circle" size={16} color={COLORS.textInverse} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[commonStyles.button, styles.confirmButton]}
                  onPress={handleConfirmAddTags}
                >
                  <Text style={commonStyles.buttonText}>{t('card.bulkAddTags')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {availableTags.length === 0 ? (
                  <Text style={commonStyles.emptyText}>No tags found on selected cards</Text>
                ) : (
                  <>
                    <View style={styles.modalTagsContainer}>
                      {availableTags.map((tag, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.selectableTagChip,
                            tagsToRemove.includes(tag) && styles.selectableTagChipSelected
                          ]}
                          onPress={() => toggleTagForRemoval(tag)}
                        >
                          <Text style={[
                            styles.selectableTagText,
                            tagsToRemove.includes(tag) && styles.selectableTagTextSelected
                          ]}>
                            {tag}
                          </Text>
                          {tagsToRemove.includes(tag) && (
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.textInverse} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[commonStyles.button, styles.confirmButton]}
                      onPress={handleConfirmRemoveTags}
                    >
                      <Text style={commonStyles.buttonText}>{t('card.bulkRemoveTags')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* QR Share Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={commonStyles.modalOverlay}>
          <View style={[commonStyles.modalContent, styles.qrModal]}>
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>{t('deck.shareTitle')}</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Text style={commonStyles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <QRCode
                value={deckJSON}
                size={250}
                backgroundColor="white"
              />
            </View>

            <Text style={styles.qrInstructions}>
              {t('deck.scanInstructions')}
            </Text>

            <TouchableOpacity
              style={[commonStyles.button, styles.closeButton]}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={commonStyles.buttonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - (SPACING.lg * 2) - (SPACING.xs * 3)) / 2;

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  overflowButton: {
    marginLeft: SPACING.md,
    padding: SPACING.xs,
  },

  // Inline Stats Badges
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  statBadgeDue: {
    backgroundColor: COLORS.primaryLight + '20',
  },
  statBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statBadgeTextDue: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tagChip: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  tagText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Description
  description: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    marginBottom: SPACING.lg,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },

  // Study Button
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },

  // Cards Section Header
  cardsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardsSectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  selectButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  selectButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  selectAllButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  selectAllText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  actionIconButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xxs,
  },
  viewToggleButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.xs,
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.surface,
  },

  // List View Card Items
  cardItem: {
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardItemSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primaryLight + '10',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardFront: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: SPACING.xs,
  },
  cardBack: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textMedium,
    flex: 1,
  },
  cardMeta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  cardTagChip: {
    backgroundColor: COLORS.primaryLight + '30',
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  cardTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Grid View Card Items
  gridRow: {
    justifyContent: 'flex-start',
  },
  gridCardItem: {
    width: cardWidth,
    margin: SPACING.xs,
    minHeight: 120,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statusDotGrid: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  gridCardFront: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  gridCardBack: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginBottom: SPACING.xs,
  },
  gridCardMeta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: 'auto',
  },

  // List Content
  listContent: {
    paddingBottom: 100,
  },
  addButton: {
    marginTop: SPACING.xxl,
  },

  // FAB
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

  // Overflow Menu
  overflowOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: SPACING.lg,
  },
  overflowMenu: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 200,
    ...SHADOWS.lg,
  },
  overflowMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  overflowMenuText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  overflowMenuTextDanger: {
    color: COLORS.danger,
  },
  overflowDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.xs,
  },

  // Deck Picker
  deckPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  deckPickerInfo: {
    flex: 1,
  },
  deckPickerName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  deckPickerMeta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },

  // Study Mode Picker
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modeOptionDisabled: {
    opacity: 0.5,
  },
  modeTextContainer: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  modeTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.2,
  },
  modeDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal,
  },
  modeDisabled: {
    color: COLORS.textLight,
  },

  // QR Modal
  qrModal: {
    alignItems: 'center',
    minHeight: 400,
  },
  qrContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.xl,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  qrInstructions: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  closeButton: {
    backgroundColor: COLORS.textMedium,
  },
  
  // Tag Input
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tagInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  addTagButton: {
    padding: SPACING.xs,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    minHeight: 50,
  },
  selectableTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectableTagChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectableTagText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  selectableTagTextSelected: {
    color: COLORS.textInverse,
  },
  confirmButton: {
    marginTop: SPACING.md,
  },

  // Card Tag Filter
  cardFilterSection: {
    marginBottom: SPACING.lg,
  },
  cardFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  cardFilterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardTagsFilter: {
    marginBottom: SPACING.md,
    maxHeight: 44,
  },
  cardFilterTagChip: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.md,
  },
  cardFilterTagChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cardFilterTagText: {
    color: COLORS.textMedium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  cardFilterTagTextActive: {
    color: COLORS.textInverse,
  },
  clearCardFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  clearCardFilterText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
});
