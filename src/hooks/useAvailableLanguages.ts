import { useState, useEffect } from 'react';
import { getAvailableLanguages, AvailableLanguage } from '../utils/availableLanguages';

/**
 * Hook pour charger les langues disponibles depuis le TTS
 * Charge au montage du composant et fournit un état de loading
 */
export function useAvailableLanguages() {
  const [languages, setLanguages] = useState<AvailableLanguage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    setLoading(true);
    try {
      const langs = await getAvailableLanguages();
      setLanguages(langs);
    } catch (e) {
      console.error('Failed to load languages:', e);
    } finally {
      setLoading(false);
    }
  };

  return { languages, loading, reload: loadLanguages };
}
