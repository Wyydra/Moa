import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card, StudySession } from "../data/model";
import { getDueCards, getDueCardsByTags, saveCard, getTTSEnabled, getTTSAutoPlay, getTTSRate, getDeckById, saveStudySession, generateId } from "../data/storage";
import { calculateNextReview, StudyResponse } from "../utils/srsAlgorithm";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import PronunciationButton from '../components/PronunciationButton';
import * as Speech from 'expo-speech';
import { updateBadgeCount } from '../utils/notifications';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudyScreen({route, navigation}: any) {
  const { t } = useTranslation();
  const { deckId, tags, reversed = false } = route.params;
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [ttsEnabled, setTTSEnabled] = useState(true);
  const [ttsAutoPlay, setTTSAutoPlay] = useState(false);
  const [ttsRate, setTTSRate] = useState(1.0);
  const [deckLanguage, setDeckLanguage] = useState<string | undefined>(undefined);


  useEffect(() => {
    loadDueCards();
    loadTTSSettings();
  }, [deckId, tags]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const loadDueCards = async () => {
    let dueCards: Card[];
    if (tags && tags.length > 0) {
      dueCards = await getDueCardsByTags(tags);
    } else {
      dueCards = await getDueCards(deckId);
    }
    const shuffledCards = [...dueCards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    
    // Load deck to get language setting
    if (deckId) {
      const deck = await getDeckById(deckId);
      if (deck) {
        setDeckLanguage(deck.language);
      }
    }
    
    setLoading(false);
    if (shuffledCards.length === 0) {
      setCompleted(true);
    }
  };

  const loadTTSSettings = async () => {
    const enabled = await getTTSEnabled();
    const autoPlay = await getTTSAutoPlay();
    const rate = await getTTSRate();
    setTTSEnabled(enabled);
    setTTSAutoPlay(autoPlay);
    setTTSRate(rate);
  };

  const handleFlip = () => {
    setShowBack(!showBack);
  };

  const handleResponse = async (response: StudyResponse) => {
    const currentCard = cards[currentIndex];
    const updatedCard = calculateNextReview(currentCard, response);
    await saveCard(updatedCard);

    // Track study session
    const responseMap: Record<StudyResponse, 'again' | 'hard' | 'good' | 'easy'> = {
      [StudyResponse.Again]: 'again',
      [StudyResponse.Hard]: 'hard',
      [StudyResponse.Good]: 'good',
      [StudyResponse.Easy]: 'easy',
    };
    
    const session: StudySession = {
      id: generateId(),
      deckId: currentCard.deckId,
      cardId: currentCard.id,
      timestamp: Date.now(),
      response: responseMap[response],
      correct: response === StudyResponse.Good || response === StudyResponse.Easy,
    };
    await saveStudySession(session);

    // Stop any ongoing TTS before transitioning
    await Speech.stop();

    if (currentIndex + 1 >= cards.length) {
      setCompleted(true);
      // Update badge count after completing study session
      await updateBadgeCount();
    } else {
      setShowBack(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = async () => {
    await Speech.stop();
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <LoadingSpinner fullScreen text={t('common.loading')} />
      </View>
    );
  }

if (completed) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={32} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={96} color={COLORS.success} />
          <Text style={styles.completedTitle}>{t('study.sessionComplete')}</Text>
          <Text style={styles.completedText}>
            {cards.length === 0 ? t('study.noDueCards') : t('study.reviewedCards', { count: cards.length })}
          </Text>
          <TouchableOpacity style={commonStyles.button} onPress={handleBack}>
            <Text style={commonStyles.buttonText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentCard = cards[currentIndex];


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
          <Text style={styles.cardText}>
            {showBack 
              ? (reversed ? currentCard.front : currentCard.back)
              : (reversed ? currentCard.back : currentCard.front)
            }
          </Text>
          {ttsEnabled && (
            <View style={styles.pronunciationContainer}>
              <PronunciationButton 
                text={showBack 
                  ? (reversed ? currentCard.front : currentCard.back)
                  : (reversed ? currentCard.back : currentCard.front)
                }
                rate={ttsRate}
                autoPlay={showBack && ttsAutoPlay}
                language={deckLanguage}
              />
            </View>
          )}
        </View>

        {!showBack ? (
          <TouchableOpacity style={[commonStyles.button, styles.showButton]} onPress={handleFlip}>
            <Text style={commonStyles.buttonText}>{t('flashcard.showAnswer')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.responseButtons}>
            <TouchableOpacity
              style={[styles.responseButton, styles.againButton]}
              onPress={() => handleResponse(StudyResponse.Again)}
            >
              <Text style={styles.responseButtonText}>{t('flashcard.again')}</Text>
              <Text style={styles.responseTime}>{'<1m'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.responseButton, styles.hardButton]}
              onPress={() => handleResponse(StudyResponse.Hard)}
            >
              <Text style={styles.responseButtonText}>{t('flashcard.hard')}</Text>
              <Text style={styles.responseTime}>
                {currentCard.repetitions === 0 ? '<1h' : '<10m'}
              </Text>
            </TouchableOpacity>

             <TouchableOpacity
              style={[styles.responseButton, styles.goodButton]}
              onPress={() => handleResponse(StudyResponse.Good)}
            >
              <Text style={styles.responseButtonText}>{t('flashcard.good')}</Text>
              <Text style={styles.responseTime}>
                {currentCard.repetitions === 0 ? '1d' : '6d'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.responseButton, styles.easyButton]}
              onPress={() => handleResponse(StudyResponse.Easy)}
            >
              <Text style={styles.responseButtonText}>{t('flashcard.easy')}</Text>
              <Text style={styles.responseTime}>4d</Text>
            </TouchableOpacity>
          </View>
        )}
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
  showButton: {
    marginTop: SPACING.xxl,
    width: '100%',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xxl,
    width: '100%',
    gap: SPACING.sm,
  },
  responseButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  againButton: {
    backgroundColor: COLORS.danger,
  },
  hardButton: {
    backgroundColor: COLORS.warning,
  },
  goodButton: {
    backgroundColor: COLORS.primary,
  },
  easyButton: {
    backgroundColor: COLORS.success,
  },
  responseButtonText: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  responseTime: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    opacity: 0.9,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  completedTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    letterSpacing: -0.5,
  },
  completedText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  pronunciationContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
});
