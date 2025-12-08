import * as Speech from 'expo-speech';
import i18n from '../i18n/config';

/**
 * Structure représentant une langue disponible dans le TTS
 */
export interface AvailableLanguage {
  code: string | undefined;  // Code BCP 47 (ex: 'fr-FR') ou undefined pour auto-detect
}

/**
 * Résout 'app-language' vers le code BCP 47 correspondant à la langue de l'app
 * Retourne le code tel quel si ce n'est pas 'app-language'
 */
export function resolveLanguageCode(code: string | undefined): string | undefined {
  if (code === 'app-language') {
    // Convertir le code i18n (fr, en) en code BCP 47 (fr-FR, en-US)
    const appLang = i18n.language;
    if (appLang === 'fr') return 'fr-FR';
    if (appLang === 'en') return 'en-US';
    return appLang; // Fallback
  }
  return code;
}

/**
 * Récupère la langue pour un côté spécifique d'une carte dans un deck
 * Gère la rétro-compatibilité avec l'ancien champ 'language'
 * @param deck - Le deck contenant les paramètres de langue
 * @param side - 'front' ou 'back'
 */
export function getDeckLanguageForSide(deck: any, side: 'front' | 'back'): string | undefined {
  if (side === 'front') {
    // Utiliser frontLanguage, ou fallback sur l'ancien 'language', ou défaut 'app-language'
    const lang = deck.frontLanguage !== undefined ? deck.frontLanguage : (deck.language || 'app-language');
    return resolveLanguageCode(lang);
  } else {
    // Utiliser backLanguage, ou fallback sur 'undefined' (auto-detect)
    const lang = deck.backLanguage !== undefined ? deck.backLanguage : undefined;
    return resolveLanguageCode(lang);
  }
}

/**
 * Récupère la liste des langues disponibles dans le TTS de l'appareil
 * Pas de mapping hardcodé, utilise directement les codes BCP 47 retournés par le TTS
 */
export async function getAvailableLanguages(includeAppLanguage: boolean = false): Promise<AvailableLanguage[]> {
  try {
    // Récupérer toutes les voix TTS disponibles
    const voices = await Speech.getAvailableVoicesAsync();
    
    // Extraire les codes de langue uniques
    const uniqueCodes = new Set<string>();
    voices.forEach(voice => uniqueCodes.add(voice.language));
    
    // Convertir en tableau et trier alphabétiquement
    const languages: AvailableLanguage[] = Array.from(uniqueCodes)
      .sort()
      .map(code => ({ code }));
    
    // Ajouter les options spéciales en premier
    if (includeAppLanguage) {
      languages.unshift({ code: 'app-language' });
    }
    languages.unshift({ code: undefined }); // Auto-detect toujours en premier
    
    return languages;
  } catch (error) {
    console.error('Error loading available languages:', error);
    // Fallback minimal
    const fallback: AvailableLanguage[] = [{ code: undefined }];
    if (includeAppLanguage) {
      fallback.push({ code: 'app-language' });
    }
    return fallback;
  }
}
