import { useEffect, useState, useRef } from "react";
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from "../utils/constants";
import * as Speech from 'expo-speech';
import { detectLanguage } from '../utils/languageDetection';

interface PronunciationButtonProps {
  text: string;
  size?: number;
  color?: string;
  rate?: number;
  autoPlay?: boolean;
  language?: string;
}

export default function PronunciationButton({
  text,
  size = 24,
    color = COLORS.primary,
    rate = 1.0,
    autoPlay = false,
    language,
}: PronunciationButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    }
  }, []);

  useEffect(() => {
    if (autoPlay && text && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      handlePress();
    }
  }, [autoPlay, text]);

  useEffect(() => {
    // Reset the autoPlay flag when text changes
    hasAutoPlayed.current = false;
  }, [text]);

  const handlePress = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsLoading(true);

    try {
      // Use provided language prop, otherwise auto-detect
      const langCode = language || await detectLanguage(text);

      console.log('[PronunciationButton] Starting speech with language:', langCode, 'rate:', rate);
      await Speech.speak(text, {
        language: langCode,
        rate: rate,
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
        onStopped:() => {
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
  };

  if (isLoading) {
    return (
      <ActivityIndicator size="small" color={color} />
    );
  }
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, isSpeaking && styles.speaking]}
    >
      <Ionicons
        name={isSpeaking ? "stop-circle" : "volume-high"}
        size={size}
        color={color}
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
});
