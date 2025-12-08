import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card } from "../data/model";
import { getCardsByDeck, getCardsByTags, getDeckById, getTTSEnabled, getTTSRate } from "../data/storage";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import PronunciationButton from '../components/PronunciationButton';
import CardContentRenderer from '../components/CardContentRenderer';
import * as Speech from 'expo-speech';
import { getDeckLanguageForSide } from '../utils/availableLanguages';

export default function BrowseScreen({route, navigation}: any) {
  const { t } = useTranslation();
  const { deckId, tags, reversed = false } = route.params;
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ttsEnabled, setTTSEnabled] = useState(true);
  const [ttsRate, setTTSRate] = useState(1.0);
  const [frontLanguage, setFrontLanguage] = useState<string | undefined>(undefined);
  const [backLanguage, setBackLanguage] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadCards();
    loadTTSSettings();
  }, [deckId, tags]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const loadCards = async () => {
    // Load ALL cards (not just due cards) for browse mode
    const allCards = tags 
      ? await getCardsByTags(tags)
      : await getCardsByDeck(deckId);
    
    setCards(allCards);
    
    // Load deck to get language settings
    if (deckId) {
      const deck = await getDeckById(deckId);
      if (deck) {
        setFrontLanguage(getDeckLanguageForSide(deck, 'front'));
        setBackLanguage(getDeckLanguageForSide(deck, 'back'));
      }
    }
    
    setLoading(false);
  };

  const loadTTSSettings = async () => {
    const enabled = await getTTSEnabled();
    const rate = await getTTSRate();
    setTTSEnabled(enabled);
    setTTSRate(rate);
  };

  const handleFlip = () => {
    setShowBack(!showBack);
  };

  const handlePrevious = async () => {
    await Speech.stop();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowBack(false);
    }
  };

  const handleNext = async () => {
    await Speech.stop();
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowBack(false);
    }
  };

  const handleBack = async () => {
    await Speech.stop();
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.emptyText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={32} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={80} color={COLORS.textLight} />
          <Text style={commonStyles.emptyText}>{t('deck.noCards')}</Text>
          <TouchableOpacity style={commonStyles.button} onPress={handleBack}>
            <Text style={commonStyles.buttonText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < cards.length - 1;

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.progress}>
          {t('study.progress', { current: currentIndex + 1, total: cards.length })}
        </Text>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={32} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <View style={[commonStyles.card, styles.flashcard]}>
          <Text style={styles.cardLabel}>{showBack ? t('flashcard.answer') : t('flashcard.question')}</Text>
          <CardContentRenderer
            content={showBack 
              ? (reversed ? currentCard.front : currentCard.back)
              : (reversed ? currentCard.back : currentCard.front)
            }
            textStyle={styles.cardText}
          />
          {ttsEnabled && (
            <View style={styles.pronunciationContainer}>
              <PronunciationButton 
                text={showBack 
                  ? (reversed ? currentCard.front : currentCard.back)
                  : (reversed ? currentCard.back : currentCard.front)
                }
                rate={ttsRate}
                autoPlay={false}
                language={showBack 
                  ? (reversed ? frontLanguage : backLanguage)
                  : (reversed ? backLanguage : frontLanguage)
                }
              />
            </View>
          )}
        </View>

        <TouchableOpacity style={[commonStyles.button, styles.flipButton]} onPress={handleFlip}>
          <Ionicons name="repeat-outline" size={20} color={COLORS.textInverse} />
          <Text style={commonStyles.buttonText}>
            {showBack ? t('flashcard.showQuestion') : t('flashcard.showAnswer')}
          </Text>
        </TouchableOpacity>

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={!canGoPrevious}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={canGoPrevious ? COLORS.text : COLORS.textLight} 
            />
            <Text style={[styles.navButtonText, !canGoPrevious && styles.navButtonTextDisabled]}>
              {t('common.previous')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
            onPress={handleNext}
            disabled={!canGoNext}
          >
            <Text style={[styles.navButtonText, !canGoNext && styles.navButtonTextDisabled]}>
              {t('common.next')}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={canGoNext ? COLORS.text : COLORS.textLight} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: SPACING.lg,
  },
  spacer: {
    width: 32,
  },
  progress: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  flashcard: {
    width: '100%',
    minHeight: 320,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.xl,
  },
  cardLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  cardText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.xxl * TYPOGRAPHY.lineHeight.normal,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  flipButton: {
    marginTop: SPACING.xxl,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    width: '100%',
    gap: SPACING.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  navButtonTextDisabled: {
    color: COLORS.textLight,
  },
  pronunciationContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
