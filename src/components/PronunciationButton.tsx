import { useEffect, useState, useRef } from "react";
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from "../utils/constants";
import { franc } from "franc";
import * as Speech from 'expo-speech';

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
    color = COLORS.skyBlue,
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

  const detectLanguageByUnicode = (text: string): string | null => {
    // Check Unicode ranges for CJK languages
    const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
    const hasChinese = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text);
    
    if (hasKorean) return 'ko-KR';
    if (hasJapanese) return 'ja-JP';
    if (hasChinese) return 'zh-CN';
    
    return null;
  };

  const detectLanguage = (text: string): string => {
    // First try Unicode detection for CJK languages (works with short text)
    const unicodeDetected = detectLanguageByUnicode(text);
    if (unicodeDetected) {
      console.log('[PronunciationButton] Unicode detected:', unicodeDetected);
      return unicodeDetected;
    }

    // For longer text, use franc for better accuracy
    if (text.length >= 10) {
      const langCode = franc(text);

      const languageMap: { [key:string]: string } = {
        'kor': 'ko-KR',  // Korean
        'jpn': 'ja-JP',  // Japanese
        'cmn': 'zh-CN',  // Chinese (Mandarin)
        'eng': 'en-US',  // English
        'fra': 'fr-FR',  // French
        'spa': 'es-ES',  // Spanish
        'deu': 'de-DE',  // German
        'ara': 'ar-SA',  // Arabic
      };

      if (langCode !== 'und' && languageMap[langCode]) {
        console.log('[PronunciationButton] Franc detected:', langCode, '->', languageMap[langCode]);
        return languageMap[langCode];
      }
    }

    // Default fallback
    console.log('[PronunciationButton] Using default: en-US');
    return 'en-US';
  }

  const handlePress = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsLoading(true);

    try {
      // Use provided language prop, otherwise auto-detect
      const langCode = language || detectLanguage(text);

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
    backgroundColor: COLORS.skyBlue + '20',
  },
});
