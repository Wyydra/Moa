import { franc } from "franc";
import * as Speech from 'expo-speech';

/**
 * Detects the language of a given text string using Unicode ranges and franc.
 * Returns a BCP 47 language code suitable for TTS.
 * 
 * Uses a two-stage approach:
 * 1. Unicode detection for CJK languages (works well with short text)
 * 2. Franc library for longer text (more accurate for Latin-based languages)
 * 3. Dynamic conversion from ISO 639-3 (franc) to BCP 47 (TTS) using available voices
 */

// Cache des voix TTS disponibles (chargé une fois)
let cachedVoices: Speech.Voice[] | null = null;

/**
 * Récupère les voix TTS (avec cache)
 */
async function getVoices(): Promise<Speech.Voice[]> {
  if (!cachedVoices) {
    cachedVoices = await Speech.getAvailableVoicesAsync();
  }
  return cachedVoices;
}

/**
 * Convertit un code ISO 639-3 (franc) vers BCP 47 (TTS) dynamiquement
 * Ex: 'fra' → cherche 'fr-*' dans les voix TTS → retourne 'fr-FR'
 */
async function francCodeToBCP47(francCode: string): Promise<string | null> {
  const voices = await getVoices();
  
  // Extraire préfixe (ex: 'fra' → 'fr', 'ita' → 'it')
  const shortCode = francCode.substring(0, 2).toLowerCase();
  
  // Chercher une voix correspondante
  const match = voices.find(v => v.language.toLowerCase().startsWith(shortCode));
  
  return match?.language || null;
}

/**
 * Detects language by checking Unicode character ranges.
 * Useful for CJK languages and short text.
 */
function detectLanguageByUnicode(text: string): string | null {
  // Check Unicode ranges for CJK languages
  const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
  const hasChinese = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text);
  
  if (hasKorean) return 'ko-KR';
  if (hasJapanese) return 'ja-JP';
  if (hasChinese) return 'zh-CN';
  
  return null;
}

/**
 * Main language detection function (now async).
 * First tries Unicode detection, then falls back to franc with dynamic TTS conversion.
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return 'en-US';
  }

  // First try Unicode detection for CJK languages (works with short text)
  const unicodeDetected = detectLanguageByUnicode(text);
  if (unicodeDetected) {
    return unicodeDetected;
  }

  // For longer text, use franc for better accuracy
  if (text.length >= 10) {
    const francCode = franc(text);
    
    if (francCode !== 'und') {
      // Essayer de convertir dynamiquement vers BCP 47
      const bcp47 = await francCodeToBCP47(francCode);
      if (bcp47) return bcp47;
    }
  }

  // Default fallback
  return 'en-US';
}
