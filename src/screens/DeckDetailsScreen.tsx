import { TouchableOpacity, Text, View, StyleSheet, FlatList, Alert, Modal } from "react-native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { deleteDeck, exportDeckToJSON, getCardsByDeck, getDeckById, getDueCards } from "../data/storage";
import { Card, Deck } from "../data/model";
import { encodeDeckToUrl as encodeDeckToURL } from "../utils/deepLinking";
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';

export default function DeckDetailsScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { deckId } = route.params;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [showModePicker, setShowModePicker] = useState(false);
  const [deckJSON, setDeckJSON] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);

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

  if (!deck) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.emptyText}>{t('common.loading')}</Text>
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
          <TouchableOpacity onPress={handleShareDeck} style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.skyBlue} />
          </TouchableOpacity>
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
        <Ionicons name="school-outline" size={20} color="white" style={{ marginRight: 8 }} />
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
              <Ionicons name="book-outline" size={24} color={COLORS.skyBlue} />
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
              <Ionicons name="create-outline" size={24} color={COLORS.skyBlue} />
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
              <Ionicons name="clipboard-outline" size={24} color={COLORS.skyBlue} />
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
              <Ionicons name="git-compare-outline" size={24} color={COLORS.skyBlue} />
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
              <Ionicons name="download-outline" size={20} color="white" style={{ marginRight: 8 }} />
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  tagChip: {
    backgroundColor: COLORS.skyBlue,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagText: {
    color: 'white',
    fontSize: 14,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  qrModal: {
    alignItems: 'center',
    minHeight: 400,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: SPACING.lg,
    borderRadius: 12,
    marginVertical: SPACING.lg,
  },
  qrInstructions: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  closeButton: {
    backgroundColor: COLORS.textLight,
  },
});
