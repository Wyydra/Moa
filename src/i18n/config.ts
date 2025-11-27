import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { getLanguagePreference } from '../data/storage';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

const resources = {
  en: {
    translation: en
  },
  fr: {
    translation: fr
  }
};

const initI18n = async () => {
  const savedLanguage = await getLanguagePreference();
  const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
  
  // Determine actual language to use
  let actualLanguage = deviceLanguage;
  if (savedLanguage && savedLanguage !== 'system') {
    actualLanguage = savedLanguage;
  } else if (savedLanguage === 'system' || !savedLanguage) {
    // Use system language, but only if supported
    actualLanguage = deviceLanguage === 'fr' ? 'fr' : 'en';
  }
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: actualLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v4',
      interpolation: {
        escapeValue: false
      }
    });
};

initI18n();

export default i18n;
