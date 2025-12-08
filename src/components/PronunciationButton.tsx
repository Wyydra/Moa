import { useEffect, useState, useRef, useCallback } from "react";
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from "../utils/constants";
import * as Speech from 'expo-speech';
import { detectLanguage } from '../utils/languageDetection';
import { useTTS } from '../contexts/TTSContext';

interface PronunciationButtonProps {
  text: string;
  size?: number;
  color?: string;
  rate?: number;
  language?: string;
  autoPlayStrategy?: 'immediate' | 'onTextChange' | 'manual';
  disabled?: boolean;
}

export default function PronunciationButton({
  text,
  size = 24,
  color = COLORS.primary,
  rate,
  autoPlayStrategy = 'manual',
  language,
  disabled = false,
}: PronunciationButtonProps) {
  const { ttsEnabled, ttsAutoPlay, ttsRate: globalRate } = useTTS();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoPlayed = useRef(false);
  const previousText = useRef<string>('');  // ✅ Commencer vide au lieu de text

  const effectiveRate = rate ?? globalRate;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // ✅ Stabilize handlePress with useCallback
  const handlePress = useCallback(async () => {
    if (disabled || !ttsEnabled) return;
    
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsLoading(true);

    try {
      // Use provided language prop, otherwise auto-detect
      const langCode = language || await detectLanguage(text);

      console.log('[PronunciationButton] Starting speech with language:', langCode, 'rate:', effectiveRate);
      await Speech.speak(text, {
        language: langCode,
        rate: effectiveRate,
        pitch: 1.0,
        onStart: () => {
          console.log('[PronunciationButton] Speech started');
          setIsSpeaking(true);
          setIsLoading(false);
        },
        onDone: () => {
          console.log('[PronunciationButton] Speech completed');
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('[PronunciationButton] Speech stopped');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('[PronunciationButton] Speech error:', error);
          setIsSpeaking(false);
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('[PronunciationButton] Failed to speak:', error);
      setIsLoading(false);
      setIsSpeaking(false);
    }
  }, [disabled, ttsEnabled, text, language, effectiveRate, isSpeaking]);

  // Strategy: immediate - joue une seule fois au montage
  useEffect(() => {
    console.log('[PronunciationButton] Effect triggered (immediate):', {
      autoPlayStrategy,
      ttsEnabled,
      ttsAutoPlay,
      hasText: !!text,
      hasAutoPlayed: hasAutoPlayed.current,
    });

    if (autoPlayStrategy === 'immediate' && ttsEnabled && ttsAutoPlay && text && !hasAutoPlayed.current) {
      console.log('[PronunciationButton] ✅ AUTO-PLAYING (immediate)');
      hasAutoPlayed.current = true;
      handlePress();
    }
  }, [autoPlayStrategy, ttsEnabled, ttsAutoPlay, text, handlePress]);

  // Strategy: onTextChange - rejoue à chaque changement de texte
  useEffect(() => {
    console.log('[PronunciationButton] Effect triggered (onTextChange):', {
      autoPlayStrategy,
      ttsEnabled,
      ttsAutoPlay,
      text,
      previousText: previousText.current,
    });

    if (autoPlayStrategy === 'onTextChange' && ttsEnabled && ttsAutoPlay) {
      if (text && text !== previousText.current) {
        console.log('[PronunciationButton] ✅ AUTO-PLAYING (onTextChange)');
        previousText.current = text;
        handlePress();
      }
    }
  }, [text, autoPlayStrategy, ttsEnabled, ttsAutoPlay, handlePress]);

  // Ne pas afficher le bouton si TTS désactivé
  if (!ttsEnabled) return null;

  if (isLoading) {
    return (
      <ActivityIndicator size="small" color={color} />
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, isSpeaking && styles.speaking, disabled && styles.disabled]}
      disabled={disabled}
    >
      <Ionicons
        name={isSpeaking ? "stop-circle" : "volume-high"}
        size={size}
        color={disabled ? COLORS.textLight : color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speaking: {
    backgroundColor: COLORS.primary + '20',
  },
  disabled: {
    opacity: 0.5,
  },
});
