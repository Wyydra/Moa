import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card } from "../data/model";
import { getDueCards, saveCard } from "../data/storage";
import { calculateNextReview, StudyResponse } from "../utils/srsAlgorithm";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from '../utils/constants';

export default function StudyScreen({route, navigation}: any) {
  const { t } = useTranslation();
  const { deckId } = route.params;
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);


  useEffect(() => {
    loadDueCards();
  }, [deckId]);

  const loadDueCards = async () => {
    const dueCards = await getDueCards(deckId);
    setCards(dueCards);
    setLoading(false);
    if (dueCards.length === 0) {
      setCompleted(true);
    }
  };

  const handleFlip = () => {
    setShowBack(!showBack);
  }

  const handleResponse = async (response: StudyResponse) => {
    const currentCard = cards[currentIndex];
    const updatedCard = calculateNextReview(currentCard, response);
    await saveCard(updatedCard);

    if (currentIndex + 1 >= cards.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setShowBack(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.emptyText}>{t('common.loading')}</Text>
      </View>
    )
  }

if (completed) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.skyBlue} />
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
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <View style={[commonStyles.card, styles.flashcard]}>
          <Text style={styles.cardLabel}>{showBack ? t('flashcard.answer') : t('flashcard.question')}</Text>
          <Text style={styles.cardText}>
            {showBack ? currentCard.back : currentCard.front}
          </Text>
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
    paddingBottom: SPACING.md,
  },
  spacer: {
    width: 28,
  },
  progress: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcard: {
    width: '100%',
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  cardLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  showButton: {
    marginTop: SPACING.xl,
    width: '100%',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    width: '100%',
  },
  responseButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  againButton: {
    backgroundColor: '#FF6B6B',
  },
  hardButton: {
    backgroundColor: '#FFA94D',
  },
  goodButton: {
    backgroundColor: COLORS.skyBlue,
  },
  easyButton: {
    backgroundColor: '#51CF66',
  },
  responseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  responseTime: {
    color: 'white',
    fontSize: 12,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  completedText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
});
