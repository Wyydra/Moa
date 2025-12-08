import * as Speech from 'expo-speech';

/**
 * Structure représentant une langue disponible dans le TTS
 */
export interface AvailableLanguage {
  code: string | undefined;  // Code BCP 47 (ex: 'fr-FR') ou undefined pour auto-detect
}

/**
 * Récupère la liste des langues disponibles dans le TTS de l'appareil
 * Pas de mapping hardcodé, utilise directement les codes BCP 47 retournés par le TTS
 */
export async function getAvailableLanguages(): Promise<AvailableLanguage[]> {
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
    
    // Ajouter "Auto-detect" en premier
    languages.unshift({ code: undefined });
    
    return languages;
  } catch (error) {
    console.error('Error loading available languages:', error);
    // Fallback minimal : juste auto-detect
    return [{ code: undefined }];
  }
}
