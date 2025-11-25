import { franc } from "franc";

/**
 * Detects the language of a given text string using Unicode ranges and franc.
 * Returns a BCP 47 language code suitable for TTS.
 * 
 * Uses a two-stage approach:
 * 1. Unicode detection for CJK languages (works well with short text)
 * 2. Franc library for longer text (more accurate for Latin-based languages)
 */

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
 * Main language detection function.
 * First tries Unicode detection, then falls back to franc for longer text.
 */
export function detectLanguage(text: string): string {
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
    const langCode = franc(text);

    const languageMap: { [key: string]: string } = {
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
      return languageMap[langCode];
    }
  }

  // Default fallback
  return 'en-US';
}
