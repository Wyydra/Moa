import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../utils/constants';
import testDeckData from '../../test-deck.json';
import { HandwritingCanvas } from '../components/HandwritingCanvas';

export default function HandwritingTestScreen() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const currentCard = testDeckData.cards[currentCardIndex];
  const expectedAnswer = currentCard.back.toLowerCase().trim();

  const handleRecognitionResult = (result: string[]) => {
    if (result && result.length > 0) {
      const recognized = result[0];
      setInputValue(recognized);
      
      const recognizedLower = recognized.toLowerCase().trim();
      if (recognizedLower === expectedAnswer) {
        setFeedback('Correct! ✓');
        setIsCorrect(true);
      } else {
        setFeedback(`Not quite. You wrote: "${recognized}"\nExpected: "${currentCard.back}"`);
        setIsCorrect(false);
      }
    }
  };

  const clearFeedback = () => {
    setFeedback('');
    setIsCorrect(null);
    setInputValue('');
  };

  const nextCard = () => {
    if (currentCardIndex < testDeckData.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      clearFeedback();
    } else {
      Alert.alert('Complete', 'You have finished all cards!', [
        {
          text: 'Start Over',
          onPress: () => {
            setCurrentCardIndex(0);
            clearFeedback();
          },
        },
      ]);
    }
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={commonStyles.screenTitle}>Handwriting Practice</Text>
        
        <View style={styles.cardPrompt}>
          <Text style={styles.promptLabel}>Write in Korean:</Text>
          <Text style={styles.promptText}>{currentCard.front}</Text>
          <Text style={styles.expectedText}>Expected: {currentCard.back}</Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Tap pencil to write"
            placeholderTextColor={COLORS.textLight}
          />
          <TouchableOpacity 
            style={styles.pencilButton}
            onPress={() => setShowCanvas(true)}
          >
            <Text style={styles.pencilIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {feedback !== '' && (
          <View style={[styles.feedbackContainer, isCorrect ? styles.correctFeedback : styles.incorrectFeedback]}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {isCorrect && (
          <TouchableOpacity 
            style={[commonStyles.button, styles.nextButton]} 
            onPress={nextCard}
          >
            <Text style={commonStyles.buttonText}>Next Card</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.progressText}>
          Card {currentCardIndex + 1} of {testDeckData.cards.length}
        </Text>
      </ScrollView>

      <Modal
        visible={showCanvas}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCanvas(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write: {currentCard.front}</Text>
              <TouchableOpacity onPress={() => setShowCanvas(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <HandwritingCanvas
              onRecognitionResult={handleRecognitionResult}
              width={350}
              height={300}
              strokeColor="#FFD700"
              strokeWidth={6}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
  },
  cardPrompt: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promptLabel: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  expectedText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: COLORS.text,
    backgroundColor: COLORS.cardBg,
  },
  pencilButton: {
    width: 48,
    height: 48,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pencilIcon: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 28,
    color: COLORS.textLight,
    fontWeight: '300',
  },
  feedbackContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  correctFeedback: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 1,
  },
  incorrectFeedback: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#28a745',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
