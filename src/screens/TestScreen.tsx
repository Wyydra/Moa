import { use, useEffect, useState } from "react";
import { Card } from "../data/model";
import { useTheme } from "@react-navigation/native";
import { getCardsByDeck } from "../data/storage";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING } from '../utils/constants';
import { Ionicons } from "@expo/vector-icons";

interface Question {
  card: Card;
  options: string[];
  correctAnswer: string;
}

export default function TestScreen({route, navigation}: any) {
  const { deckId } = route.params;
  const [cards, setCards] = useState<Card[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    loadCardsAndGenerateQuestions()
  }, [deckId]);

  const loadCardsAndGenerateQuestions = async () => {
    const allCards = await getCardsByDeck(deckId);
    setCards(allCards);

    if(allCards.length === 0){
      setCompleted(true);
      setLoading(false);
      return;
    }

    const generatedQuestions: Question[] = allCards.map((card) => {
      const correctAnswer = card.back;

      const wrongAnswer = allCards
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

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === questions[currentIndex].correctAnswer;
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
        <Text style={commonStyles.emptyText}>loading...</Text>
      </View>
    );
  }

  if (completed) {
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
            <Text style={styles.completedTitle}> Test Complete!</Text>
            <Text style={styles.completedText}>
              Score: {correctCount} / {questions.length} ({Math.round((correctCount / questions.length) * 100)}%)
            </Text>
            <TouchableOpacity style={commonStyles.button} onPress={handleBack}>
              <Text style={commonStyles.buttonText}>Done</Text>
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
          {currentIndex + 1} / {questions.length}
        </Text>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.testContainer}>
        <View style={[commonStyles.card, styles.questionCard]}>
          <Text style={styles.cardLabel}>Question</Text>
          <Text style={styles.cardText}>{currentQuestion.card.front}</Text>
        </View>

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

            return (
              <TouchableOpacity
                key={index}
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
            );
          })}
        </View>

        {showResult && (
          <TouchableOpacity
            style={[commonStyles.button, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={commonStyles.buttonText}>
              {currentIndex + 1 >= questions.length ? 'Finish' : 'Next'}
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
  },
  optionCorrect: {
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: '#51CF66',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#51CF6620',
  },
  optionIncorrect: {
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF6B6B20',
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
