import { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Card, StudySession } from "../data/model";
import { getCardsByDeck, getCardsByTags, saveStudySession, generateId } from "../data/storage";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING } from '../utils/constants';
import { Ionicons } from "@expo/vector-icons";

interface Question {
  card: Card;
  options: string[];
  correctAnswer: string;
}

export default function TestScreen({route, navigation}: any) {
  const { t } = useTranslation();
  const { deckId, tags } = route.params;
  const [cards, setCards] = useState<Card[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const optionAnims = useRef<Animated.Value[]>([]).current;
  const questionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCardsAndGenerateQuestions()
  }, [deckId, tags]);

  useEffect(() => {
    if (questions.length > 0) {
      animateOptions();
      animateQuestion();
    }
  }, [currentIndex, questions]);

  const animateQuestion = () => {
    questionAnim.setValue(0);
    Animated.spring(questionAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const animateOptions = () => {
    if (optionAnims.length === 0) {
      for (let i = 0; i < 4; i++) {
        optionAnims.push(new Animated.Value(0));
      }
    }
    
    optionAnims.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }).start();
    });
  };

  const loadCardsAndGenerateQuestions = async () => {
    const allCards = tags 
      ? await getCardsByTags(tags)
      : await getCardsByDeck(deckId);
    
    const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);

    if(shuffledCards.length === 0){
      setCompleted(true);
      setLoading(false);
      return;
    }

    const generatedQuestions: Question[] = shuffledCards.map((card) => {
      const correctAnswer = card.back;

      const wrongAnswer = shuffledCards
        .filter(c => c.id !== card.id)
        .map(c => c.back)
        .sort(() => Math.random() - 0.5)
        .slice(0,3);

      const options = [correctAnswer, ...wrongAnswer]
          .sort(() => Math.random() - 0.5);

      return {
        card,
        options,
        correctAnswer
      };
    });

    setQuestions(generatedQuestions);
    setLoading(false);
  }

  const handleSelectAnswer = async (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    // Track study session
    const session: StudySession = {
      id: generateId(),
      deckId: currentQuestion.card.deckId,
      cardId: currentQuestion.card.id,
      timestamp: Date.now(),
      response: isCorrect ? 'good' : 'again',
      correct: isCorrect,
    };
    await saveStudySession(session);
    
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
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
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={28} color={COLORS.text}/>
          </TouchableOpacity>
        </View>
          <View style={styles.completedContainer}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.skyBlue} />
            <Text style={styles.completedTitle}>{t('modes.test.sessionComplete')}</Text>
            <Text style={styles.completedText}>
              {t('modes.test.score', { correct: correctCount, total: questions.length, percentage })}
            </Text>
            <TouchableOpacity style={commonStyles.button} onPress={handleBack}>
              <Text style={commonStyles.buttonText}>{t('common.done')}</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.progress}>
          {t('study.progress', { current: currentIndex + 1, total: questions.length })}
        </Text>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.testContainer}>
        <Animated.View 
          style={[
            commonStyles.card, 
            styles.questionCard,
            {
              opacity: questionAnim,
              transform: [{
                scale: questionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            }
          ]}
        >
          <Text style={styles.cardLabel}>{t('modes.test.question')}</Text>
          <Text style={styles.cardText}>{currentQuestion.card.front}</Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;

            let optionStyle = styles.option;
            if (showResult && isCorrect) {
              optionStyle = styles.optionCorrect;
            } else if (showResult && isSelected && !isCorrect) {
              optionStyle = styles.optionIncorrect;
            }

            const animatedStyle = optionAnims[index] ? {
              opacity: optionAnims[index],
              transform: [{
                translateX: optionAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
            } : {};

            return (
              <Animated.View key={index} style={animatedStyle}>
                <TouchableOpacity
                  style={[styles.option, optionStyle]}
                  onPress={() => handleSelectAnswer(option)}
                  disabled={showResult}
                >
                  <Text style={styles.optionText}>{option}</Text>
                  {showResult && isCorrect && (
                    <Ionicons name="checkmark-circle" size={24} color="#51CF66" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {showResult && (
          <TouchableOpacity
            style={[commonStyles.button, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={commonStyles.buttonText}>
              {currentIndex + 1 >= questions.length ? t('common.finish') : t('common.next')}
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  testContainer: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  optionsContainer: {
    gap: SPACING.md,
  },
  option: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionCorrect: {
    backgroundColor: '#51CF6620',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: '#51CF66',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionIncorrect: {
    backgroundColor: '#FF6B6B20',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  nextButton: {
    marginTop: SPACING.xl,
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
