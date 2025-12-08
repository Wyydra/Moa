import { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Card, StudySession } from "../data/model";
import { getCardsByDeck, getCardsByTags, saveStudySession, generateId, getDeckById } from "../data/storage";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Animated } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { HandwritingModule } from '../components/handwriting';
import PronunciationButton from '../components/PronunciationButton';
import CardContentRenderer from '../components/CardContentRenderer';
import * as Speech from 'expo-speech';
import { getDeckLanguageForSide } from '../utils/availableLanguages';

export default function WriteScreen({route, navigation}: any) {
  const { t } = useTranslation();
  const { deckId, tags, reversed = false } = route.params;
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [frontLanguage, setFrontLanguage] = useState<string | undefined>(undefined);
  const [backLanguage, setBackLanguage] = useState<string | undefined>(undefined);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCards();
  }, [deckId, tags]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);



  const loadCards = async () => {
    const allCards = tags 
      ? await getCardsByTags(tags)
      : await getCardsByDeck(deckId);
    const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setLoading(false);
    if (shuffledCards.length === 0) {
      setCompleted(true);
    }
    
    // Load deck languages for TTS
    if (deckId) {
      const deck = await getDeckById(deckId);
      if (deck) {
        setFrontLanguage(getDeckLanguageForSide(deck, 'front'));
        setBackLanguage(getDeckLanguageForSide(deck, 'back'));
      }
    }
  };

  const handleSubmit = async () => {
    const currentCard = cards[currentIndex];
    const correctAnswer = reversed ? currentCard.front : currentCard.back;
    const correct = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    
    // Track study session
    const session: StudySession = {
      id: generateId(),
      deckId: currentCard.deckId,
      cardId: currentCard.id,
      timestamp: Date.now(),
      response: correct ? 'good' : 'again',
      correct: correct,
    };
    await saveStudySession(session);
    
    if (correct) {
      setCorrectCount(correctCount + 1);
      Animated.spring(resultAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      Animated.spring(resultAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= cards.length) {
      setCompleted(true);
    } else {
      resultAnim.setValue(0);
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowResult(false);
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
    );
  }

  if (completed) {
    const percentage = Math.round((correctCount / cards.length) * 100);
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.completedTitle}>{t('modes.write.sessionComplete')}</Text>
          <Text style={styles.completedText}>
            {t('modes.write.score', { correct: correctCount, total: cards.length, percentage })}
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
        <View style={[commonStyles.card, styles.questionCard]}>
          <Text style={styles.cardLabel}>{t('modes.test.question')}</Text>
          <CardContentRenderer
            content={reversed ? currentCard.back : currentCard.front}
            textStyle={styles.cardText}
          />
          <View style={styles.ttsContainer}>
            <PronunciationButton
              text={reversed ? currentCard.back : currentCard.front}
              autoPlayStrategy="onTextChange"
              language={reversed ? backLanguage : frontLanguage}
            />
          </View>
        </View>

        <View style={styles.answerSection}>
          <View style={styles.answerHeader}>
            <Text style={styles.answerLabel}>{t('modes.write.yourAnswer')}</Text>
            <HandwritingModule
              initialText={userAnswer}
              onTextChange={setUserAnswer}
              mode="append"
              disabled={showResult}
            />
          </View>
          <Animated.View
            style={{
              transform: [{ translateX: shakeAnim }],
            }}
          >
            <TextInput
              style={[
                styles.input,
                showResult && (isCorrect ? styles.inputCorrect : styles.inputIncorrect)
              ]}
              value={userAnswer}
              onChangeText={setUserAnswer}
              editable={!showResult}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Animated.View>
        </View>

        {showResult && (
          <Animated.View 
            style={[
              styles.resultSection,
              {
                opacity: resultAnim,
                transform: [
                  {
                    scale: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
              <Ionicons 
                name={isCorrect ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.resultText}>
                {t(isCorrect ? 'modes.write.correct' : 'modes.write.incorrect')}
              </Text>
            </View>
            {!isCorrect && (
              <View style={styles.correctAnswerBox}>
                <Text style={styles.correctAnswerLabel}>{t('modes.write.correctAnswer')}:</Text>
                <Text style={styles.correctAnswerText}>{reversed ? currentCard.front : currentCard.back}</Text>
                <View style={styles.ttsContainer}>
                  <PronunciationButton
                    text={reversed ? currentCard.front : currentCard.back}
                    autoPlayStrategy="immediate"
                    language={reversed ? frontLanguage : backLanguage}
                  />
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {!showResult ? (
          <TouchableOpacity 
            style={[commonStyles.button, styles.submitButton, !userAnswer.trim() && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={!userAnswer.trim()}
          >
            <Text style={commonStyles.buttonText}>{t('modes.write.submit')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[commonStyles.button, styles.nextButton]} 
            onPress={handleNext}
          >
            <Text style={commonStyles.buttonText}>
              {currentIndex + 1 >= cards.length ? t('common.finish') : t('common.next')}
            </Text>
          </TouchableOpacity>
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
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  cardContainer: {
    flex: 1,
    paddingTop: SPACING.xl,
  },
  questionCard: {
    width: '100%',
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  ttsContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  answerSection: {
    marginBottom: SPACING.lg,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  answerLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  inputCorrect: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '20',
  },
  inputIncorrect: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + '20',
  },
  resultSection: {
    marginBottom: SPACING.lg,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  correctBadge: {
    backgroundColor: COLORS.success,
  },
  incorrectBadge: {
    backgroundColor: COLORS.danger,
  },
  resultText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
  correctAnswerBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    ...SHADOWS.sm,
  },
  correctAnswerLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  correctAnswerText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  nextButton: {
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
