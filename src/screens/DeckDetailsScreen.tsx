import { TouchableOpacity, Text, View, StyleSheet, FlatList, Alert, Modal } from "react-native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { deleteDeck, exportDeckToJSON, getCardsByDeck, getDeckById, getDueCards } from "../data/storage";
import { Card, Deck } from "../data/model";
import { encodeDeckToUrl as encodeDeckToURL } from "../utils/deepLinking";
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    setIsLoading(false);
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
    navigation.navigate('LibraryList');
  };

  const handleEditDeck = () => {
    navigation.navigate('EditDeck', { deckId });
  }

  const handleDeleteDeck = () => {
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
            await deleteDeck(deckId);
            navigation.goBack();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleShareDeck = async () => {
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
    navigation.navigate('EditCard', { deckId, cardId: card.id });
  };

  const renderCard = ({ item, index }: { item: Card, index: number }) => {
    return (
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
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={[commonStyles.screenTitle, styles.title]}>{deck.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShareDeck} style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditDeck} style={styles.actionButton}>
            <Ionicons name="create-outline" size={24} color={COLORS.textMedium} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteDeck} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cards.length}</Text>
          <Text style={styles.statLabel}>{t('deck.totalCards')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, dueCount > 0 && styles.statNumberDue]}>{dueCount}</Text>
          <Text style={styles.statLabel}>{t('deck.dueForReview')}</Text>
        </View>
      </View>

      {deck.description && (
        <Text style={styles.description}>{deck.description}</Text>
      )}

      {deck.tags && deck.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {deck.tags.map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[commonStyles.button, styles.studyButton]}
        onPress={() => setShowModePicker(true)}
      >
        <Ionicons name="school-outline" size={22} color={COLORS.textInverse} />
        <Text style={commonStyles.buttonText}>{t('deck.startStudying')}</Text>
      </TouchableOpacity>

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
              style={[commonStyles.button, styles.exportButton]}
              onPress={async () => {
                setShowQRModal(false);
                await handleExportFile();
              }}
            >
              <Ionicons name="download-outline" size={22} color={COLORS.textInverse} />
              <Text style={commonStyles.buttonText}>{t('deck.exportAsFile')}</Text>
            </TouchableOpacity>

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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.lg,
  },
  title: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    marginBottom: SPACING.xl,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  tagChip: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  tagText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  addButton: {
    marginTop: SPACING.xxl,
  },
  listContent: {
    paddingBottom: 100,
  },
  cardItem: {
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  cardChevron: {
    marginLeft: SPACING.md,
  },
  cardFront: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    flex: 1,
  },
  cardBack: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
    flex: 1,
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
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  statNumberDue: {
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.xl,
  },
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  closeButton: {
    backgroundColor: COLORS.textMedium,
  },
});
