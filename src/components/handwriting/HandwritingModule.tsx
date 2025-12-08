import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, StyleProp, ViewStyle, TextStyle, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HandwritingCanvas } from './HandwritingCanvas';
import { commonStyles } from '../../styles/commonStyles';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../utils/constants';

interface HandwritingModuleProps {
  // Text management
  initialText?: string;
  onTextChange: (text: string) => void;
  mode?: 'append' | 'replace';
  
  // Button appearance
  buttonText?: string;
  buttonIcon?: string;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonTextStyle?: StyleProp<TextStyle>;
  showButton?: boolean;
  
  // Modal control
  visible?: boolean;
  onClose?: () => void;
  
  // Canvas configuration
  canvasWidth?: number;
  canvasHeight?: number;
  strokeWidth?: number;
  
  // Optional features
  showDeleteButton?: boolean;
  disabled?: boolean;
}

export const HandwritingModule: React.FC<HandwritingModuleProps> = ({
  initialText = '',
  onTextChange,
  mode = 'append',
  buttonText,
  buttonIcon = 'brush-outline',
  buttonStyle,
  buttonTextStyle,
  showButton = true,
  visible: externalVisible,
  onClose,
  canvasWidth, // Will be calculated if not provided
  canvasHeight, // Will be calculated if not provided
  strokeWidth = 3,
  showDeleteButton = true,
  disabled = false,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const finalCanvasWidth = canvasWidth || Math.floor(screenWidth * 0.85);
  const finalCanvasHeight = canvasHeight || Math.floor(screenHeight * 0.4);
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentText, setCurrentText] = useState(initialText);
  const [recognitionHistory, setRecognitionHistory] = useState<string[]>([]);
  const [initialTextSnapshot, setInitialTextSnapshot] = useState(initialText);

  // Sync with external text changes
  useEffect(() => {
    setCurrentText(initialText);
    setRecognitionHistory([]);
  }, [initialText]);

  // Use external visibility control if provided
  const modalVisible = externalVisible !== undefined ? externalVisible : isModalVisible;

  const openModal = () => {
    if (disabled) return;
    setInitialTextSnapshot(currentText); // Freeze the initial text
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    onClose?.();
  };

  const resetToSnapshot = () => {
    setCurrentText(initialTextSnapshot);
    setRecognitionHistory([]);
    onTextChange(initialTextSnapshot);
  };

  const handleRecognitionResult = (results: string[]) => {
    if (results.length === 0) return;
    
    const fullRecognition = results[0];
    const updatedText = mode === 'append' 
      ? initialTextSnapshot + fullRecognition
      : fullRecognition;
    
    setCurrentText(updatedText);
    setRecognitionHistory([fullRecognition]);
    onTextChange(updatedText);
  };

  return (
    <>
      {/* Trigger button (optional) */}
      {showButton && (
        <TouchableOpacity
          style={[styles.triggerButton, buttonStyle, disabled && styles.disabled]}
          onPress={openModal}
          disabled={disabled}
        >
          <Ionicons 
            name={buttonIcon as any} 
            size={20} 
            color={disabled ? COLORS.textLight : COLORS.primary} 
          />
          <Text style={[styles.triggerButtonText, buttonTextStyle, disabled && styles.disabledText]}>
            {buttonText || t('modes.write.writeByHand')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Handwriting Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={commonStyles.modalOverlay}>
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <View style={[commonStyles.modalContent, styles.modalContent]}>
              {/* Header with close button in top-right corner */}
              <View style={styles.headerContainer}>
                <Text style={commonStyles.modalTitle}>
                  {t('modes.write.writeByHand')}
                </Text>
                <TouchableOpacity 
                  onPress={closeModal}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={commonStyles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>

            {/* Text display area */}
            <View style={styles.textDisplay}>
              <Text style={styles.textDisplayLabel}>
                {t('modes.write.yourAnswer')}:
              </Text>
              <Text style={styles.textDisplayValue}>
                {currentText || ''}
              </Text>
            </View>

            {/* Handwriting Canvas */}
            <HandwritingCanvas
              onRecognitionResult={handleRecognitionResult}
              onClear={resetToSnapshot}
              onDone={closeModal}
              width={finalCanvasWidth}
              height={finalCanvasHeight}
              strokeWidth={strokeWidth}
              disableNavigation={false}
            />

            {/* Actions row - Delete button */}
            {showDeleteButton && recognitionHistory.length > 0 && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={resetToSnapshot}
                >
                  <Ionicons name="backspace-outline" size={20} color={COLORS.danger} />
                  <Text style={styles.deleteButtonText}>
                    {t('common.delete')} All
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Trigger button
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  triggerButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: 4,
  },
  disabled: {
    opacity: 0.5,
    borderColor: COLORS.border,
  },
  disabledText: {
    color: COLORS.textLight,
  },
  
  // Safe area
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  // Modal content
  modalContent: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg, // Override commonStyles paddingBottom: 40
    alignItems: 'center',
  },
  
  // Header
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  
  // Close button (absolute position in top-right)
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  
  // Text display area
  textDisplay: {
    width: '100%',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
  },
  textDisplayLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textDisplayValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    minHeight: 30,
  },
  
  // Actions row
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    width: '100%',
  },
  
  // Delete button
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: 4,
  },
});
